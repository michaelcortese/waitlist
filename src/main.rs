// Import necessary dependencies for web server, database, serialization, and authentication
use actix_web::{web, App, HttpResponse, HttpServer, post, get, delete};
use serde::{Deserialize, Serialize};
use sqlx::postgres::PgPool;
use uuid::Uuid;
use bcrypt::{hash, verify, DEFAULT_COST};
use chrono::{DateTime, Utc};
use jsonwebtoken::{encode, Header, EncodingKey};

// Claims structure for JWT token payload
#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: String,      // Subject (user ID)
    role: String,     // User role (e.g., "admin", "staff")
    exp: usize,       // Token expiration timestamp
}

// Secret key for JWT token signing - in production, this should be stored securely
const SECRET: &[u8] = b"super_secret_key";

// Data structure for user registration
#[derive(Deserialize)]
struct RegisterData {
    email: String,
    password: String,
    role: String,
}

// Data structure for creating a new restaurant
#[derive(Deserialize)]
struct RestaurantData {
    name: String,
    address: String,
    phone: String,
}

// Data structure for adding a customer to the waitlist
#[derive(Deserialize)]
struct WaitlistEntryData {
    customer_name: String,
    party_size: i32,
    phone_number: String,
    notes: Option<String>,  // Optional notes about the customer's requirements
}

// Data structure for waitlist entries with full details
#[derive(Serialize, Deserialize, sqlx::FromRow)]
struct WaitlistEntry {
    id: Uuid,
    restaurant_id: Option<Uuid>,
    customer_name: String,
    party_size: i32,
    phone_number: String,
    notes: Option<String>,
    status: String,         // Current status in the waitlist (e.g., "waiting", "seated", "cancelled")
    created_at: Option<DateTime<Utc>>,
    updated_at: Option<DateTime<Utc>>,
}

// Endpoint to register a new user
#[post("/register")]
async fn register(data: web::Json<RegisterData>, db: web::Data<PgPool>) -> HttpResponse {
    // Hash the password before storing
    let hashed_password = hash(&data.password, DEFAULT_COST).unwrap();
    let user_id = Uuid::new_v4();

    // Insert new user into database
    let result = sqlx::query!(
        "INSERT INTO users (id, email, password, role) VALUES ($1, $2, $3, $4)",
        user_id, data.email, hashed_password, data.role
    ).execute(db.get_ref()).await;

    match result {
        Ok(_) => HttpResponse::Ok().json("User registered"),
        Err(_) => HttpResponse::InternalServerError().json("Error registering user"),
    }
}

// Data structure for user login
#[derive(Deserialize)]
struct LoginData {
    email: String,
    password: String,
}

// Endpoint to authenticate users and generate JWT token
#[post("/login")]
async fn login(data: web::Json<LoginData>, db: web::Data<PgPool>) -> HttpResponse {
    // Fetch user from database
    let row = sqlx::query!(
        "SELECT id, password, role FROM users WHERE email = $1",
        data.email
    ).fetch_one(db.get_ref()).await;

    match row {
        Ok(user) => {
            // Verify password and generate JWT token if valid
            if verify(&data.password, &user.password).unwrap() {
                let claims = Claims {
                    sub: user.id.to_string(),
                    role: user.role,
                    exp: 10000000000,  // Token expiration time
                };
                let token = encode(&Header::default(), &claims, &EncodingKey::from_secret(SECRET)).unwrap();
                HttpResponse::Ok().json(token)
            } else {
                HttpResponse::Unauthorized().json("Invalid credentials")
            }
        }
        Err(_) => HttpResponse::Unauthorized().json("Invalid credentials"),
    }
}

// Data structure for updating restaurant wait time
#[derive(Deserialize)]
struct UpdateWaitTime {
    wait_time: i32,
}

// Endpoint to update a restaurant's current wait time
#[post("/restaurant/{restaurant_id}/update_wait_time")]
async fn update_wait_time(
    path: web::Path<Uuid>,
    data: web::Json<UpdateWaitTime>,
    db: web::Data<PgPool>,
) -> HttpResponse {
    let restaurant_id = path.into_inner();
    let result = sqlx::query!(
        "UPDATE restaurants SET current_wait_time = $1 WHERE id = $2",
        data.wait_time, restaurant_id
    ).execute(db.get_ref()).await;

    match result {
        Ok(_) => HttpResponse::Ok().json("Wait time updated"),
        Err(_) => HttpResponse::InternalServerError().json("Error updating wait time"),
    }
}

// Endpoint to create a new restaurant
#[post("/restaurant")]
async fn create_restaurant(
    data: web::Json<RestaurantData>,
    db: web::Data<PgPool>,
) -> HttpResponse {
    let restaurant_id = Uuid::new_v4();
    let result = sqlx::query!(
        "INSERT INTO restaurants (id, name, address, phone, current_wait_time) VALUES ($1, $2, $3, $4, 0)",
        restaurant_id, data.name, data.address, data.phone
    ).execute(db.get_ref()).await;

    match result {
        Ok(_) => HttpResponse::Ok().json(restaurant_id),
        Err(_) => HttpResponse::InternalServerError().json("Error creating restaurant"),
    }
}

// Endpoint to add a customer to a restaurant's waitlist
#[post("/restaurant/{restaurant_id}/waitlist")]
async fn add_to_waitlist(
    path: web::Path<Uuid>,
    data: web::Json<WaitlistEntryData>,
    db: web::Data<PgPool>,
) -> HttpResponse {
    let restaurant_id = path.into_inner();
    let entry_id = Uuid::new_v4();
    
    // Insert new waitlist entry with initial 'waiting' status
    let result = sqlx::query!(
        "INSERT INTO waitlist_entries (id, restaurant_id, customer_name, party_size, phone_number, notes, status, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, 'waiting', NOW(), NOW())",
        entry_id, restaurant_id, data.customer_name, data.party_size, data.phone_number, data.notes
    ).execute(db.get_ref()).await;

    match result {
        Ok(_) => HttpResponse::Ok().json(entry_id),
        Err(_) => HttpResponse::InternalServerError().json("Error adding to waitlist"),
    }
}

// Endpoint to get the current waitlist for a restaurant
#[get("/restaurant/{restaurant_id}/waitlist")]
async fn get_waitlist(
    path: web::Path<Uuid>,
    db: web::Data<PgPool>,
) -> HttpResponse {
    let restaurant_id = path.into_inner();
    
    // Fetch all waitlist entries for the restaurant, ordered by creation time
    let result = sqlx::query!(
        "SELECT id, restaurant_id, customer_name, party_size, phone_number, notes, status, created_at, updated_at 
         FROM waitlist_entries 
         WHERE restaurant_id = $1 
         ORDER BY created_at DESC",
        restaurant_id
    ).fetch_all(db.get_ref()).await;

    match result {
        Ok(entries) => {
            let waitlist_entries: Vec<WaitlistEntry> = entries
                .into_iter()
                .map(|row| WaitlistEntry {
                    id: row.id,
                    restaurant_id: row.restaurant_id,
                    customer_name: row.customer_name,
                    party_size: row.party_size,
                    phone_number: row.phone_number,
                    notes: row.notes,
                    status: row.status,
                    created_at: row.created_at,
                    updated_at: row.updated_at,
                })
                .collect();
            HttpResponse::Ok().json(waitlist_entries)
        }
        Err(_) => HttpResponse::InternalServerError().finish()
    }
}

// Endpoint to update a customer's status in the waitlist
#[post("/waitlist/{entry_id}/status")]
async fn update_waitlist_status(
    path: web::Path<Uuid>,
    status: web::Json<String>,
    db: web::Data<PgPool>,
) -> HttpResponse {
    let entry_id = path.into_inner();
    
    // Update the status and timestamp of the waitlist entry
    let result = sqlx::query!(
        "UPDATE waitlist_entries SET status = $1, updated_at = NOW() WHERE id = $2",
        status.0, entry_id
    ).execute(db.get_ref()).await;

    match result {
        Ok(_) => HttpResponse::Ok().json("Status updated"),
        Err(_) => HttpResponse::InternalServerError().json("Error updating status"),
    }
}

// Endpoint to remove a customer from the waitlist
#[delete("/waitlist/{entry_id}")]
async fn remove_from_waitlist(
    path: web::Path<Uuid>,
    db: web::Data<PgPool>,
) -> HttpResponse {
    let entry_id = path.into_inner();
    
    // Delete the waitlist entry
    let result = sqlx::query!(
        "DELETE FROM waitlist_entries WHERE id = $1",
        entry_id
    ).execute(db.get_ref()).await;

    match result {
        Ok(_) => HttpResponse::Ok().json("Entry removed"),
        Err(_) => HttpResponse::InternalServerError().json("Error removing entry"),
    }
}

// Main application entry point
#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Database connection URL - in production, this should be loaded from environment variables
    let database_url = "postgres://postgres:postgres@localhost/waitlist_db";
    let pool = PgPool::connect(&database_url).await.expect("Failed to create pool");

    // Create and configure the web server
    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(pool.clone()))
            .service(register)
            .service(login)
            .service(create_restaurant)
            .service(update_wait_time)
            .service(add_to_waitlist)
            .service(get_waitlist)
            .service(update_waitlist_status)
            .service(remove_from_waitlist)
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}