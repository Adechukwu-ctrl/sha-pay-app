const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.all('SELECT id, email, user_type, available_balance, pending_balance FROM users;', (err, users) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Users in database:', users.length);
    users.forEach(user => {
      console.log(JSON.stringify({
        id: user.id,
        email: user.email,
        userType: user.user_type,
        availableBalance: user.available_balance,
        pendingBalance: user.pending_balance
      }, null, 2));
    });
  }
  db.close();
});