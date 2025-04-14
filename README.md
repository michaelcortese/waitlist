# 🚀 TABLE READY: THE WAITLIST APP THAT'S SO GOOD IT'LL MAKE YOU FORGET YOU'RE WAITING! 🍕

![Table Ready Logo](https://media.giphy.com/media/3o7TKS8Dk5p0EwR5n2/giphy.gif)

## 🦖 WHAT IN THE NAME OF ALL THAT IS HOLY IS THIS?! 

**TableReady** is not just another waitlist app. It's a **WAITLIST REVOLUTION** that's about to make standing in line as exciting as finding out your ex got a terrible haircut! 

> "I used to spend 2 hours waiting for a table. Now I spend 2 hours watching cat videos while waiting for a table. **PROGRESS!**" - Some Guy Who Used Our App

## 🎮 FEATURES THAT'LL BLOW YOUR MIND (AND MAYBE YOUR DIET)

### 🧑‍🍳 FOR RESTAURANTS:
- **Real-time Wait Time Updates**: Update your wait times faster than you can say "kitchen's backed up"
- **Digital Queue Management**: Manage your waitlist like a boss, not like someone who just discovered Excel
- **Customer Notifications**: Alert customers when their table is ready, so they can stop pretending to enjoy the bar area
- **Analytics Dashboard**: See how many people are waiting, how long they've been waiting, and how many have given up and gone to McDonald's

### 🧑‍🍽️ FOR CUSTOMERS:
- **Join Waitlists Remotely**: Join a waitlist from your couch, your car, or that weird place you go to avoid your in-laws
- **Real-time Position Updates**: Know exactly where you are in line, so you can calculate how many episodes of The Office you can watch
- **Estimated Wait Times**: Plan your life around waiting, because that's what adulthood is all about
- **Table Ready Notifications**: Get notified when your table is ready, so you can stop pretending to enjoy the bar area

## 🛠️ TECH STACK THAT'LL MAKE YOUR TECH FRIENDS JEALOUS

- **Backend**: Rust (because we're not cowards who use Node.js)
- **Frontend**: React (because we're not savages who use vanilla JS)
- **Database**: PostgreSQL (because we're not heathens who use MongoDB)
- **Authentication**: JWT (because we're not anarchists who use session cookies)
- **Styling**: CSS (because we're not monsters who use inline styles)

## 🚀 GETTING STARTED (AKA THE PART WHERE YOU ACTUALLY HAVE TO DO STUFF)

### Prerequisites (Things You Need Before You Can Be Cool Like Us)

- Rust (the programming language, not the video game)
- Node.js (the JavaScript runtime, not the thing you use to hang your clothes)
- PostgreSQL (the database, not the thing you use to send letters)
- A sense of humor (optional, but highly recommended)

### Installation (The Part Where You Copy-Paste Commands and Hope for the Best)

1. Clone the repository (or download it if you're old school):
   ```bash
   git clone https://github.com/michaelcortese/waitlist.git
   cd waitlist
   ```

2. Set up the backend (the part where you pretend to understand what's happening):
   ```bash
   cd backend
   cargo build
   cargo run
   ```

3. Set up the frontend (the part where you install a million packages):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. Set up the database (the part where you hope you don't mess up):
   ```bash
   # Create a PostgreSQL database named 'waitlist_db'
   # Then run the migrations (which we haven't created yet, but you can pretend they exist)
   ```

5. Open your browser and navigate to `http://localhost:5173` (the part where you hope everything works)

## 🧪 API DOCUMENTATION (FOR THE NERDS AMONG US)

### Authentication Endpoints

- `POST /register` - Register a new user (because everyone needs an account for everything)
- `POST /login` - Login to your account (because remembering passwords is so 2010)

### Restaurant Endpoints

- `POST /restaurant` - Create a new restaurant (for when you're tired of working for The Man)
- `POST /restaurant/{id}/update_wait_time` - Update the current wait time (for when you realize you're in over your head)
- `GET /restaurant/{id}/waitlist` - Get the current waitlist (for when you need to know how many people are waiting)
- `POST /restaurant/{id}/waitlist` - Add a customer to the waitlist (for when you're ready to make someone else wait)

### Waitlist Endpoints

- `POST /waitlist/{id}/status` - Update a waitlist entry's status (for when someone finally gives up and leaves)
- `DELETE /waitlist/{id}` - Remove a customer from the waitlist (for when they've been waiting so long they've evolved into a new species)
- `PUT /waitlist/{id}/position` - Update a customer's position in the waitlist (for when you need to pretend you're not playing favorites)
- `GET /waitlist/{id}/refund-eligibility` - Check if a customer is eligible for a refund (for when you've messed up so bad you need to pay them to leave)

## 🤝 CONTRIBUTING (AKA HOW TO MAKE YOURSELF FEEL IMPORTANT)

1. Fork the repository (because you're a rebel)
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature that will change the world'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request (and hope that someone notices)

## 📜 LICENSE (THE PART EVERYONE SKIPS)

This project is licensed under the MIT License - see the LICENSE file for details (which we haven't created yet, but you can pretend it exists).

## 🙏 ACKNOWLEDGMENTS (THE PART WHERE WE THANK PEOPLE WE'VE NEVER MET)

- [Rust](https://www.rust-lang.org/) - For being the language that makes us feel superior to JavaScript developers
- [React](https://reactjs.org/) - For being the framework that makes us feel superior to jQuery developers
- [PostgreSQL](https://www.postgresql.org/) - For being the database that makes us feel superior to MongoDB developers
- [Coffee](https://en.wikipedia.org/wiki/Coffee) - For keeping us awake long enough to write this README

## 🎭 ABOUT THE DEVELOPERS (THE PART WHERE WE TALK ABOUT OURSELVES)

We're just a bunch of developers who got tired of waiting in line at restaurants and decided to do something about it. Now we spend our time waiting for our code to compile instead.

---

<p align="center">
  <b>Made with ❤️ and probably too much caffeine</b>
</p>

<p align="center">
  <img src="https://media.giphy.com/media/3o7TKS8Dk5p0EwR5n2/giphy.gif" width="200">
</p>

<p align="center">
  <i>If you're still reading this, you must be really bored. Go outside. Touch grass. Do something with your life.</i>
</p>