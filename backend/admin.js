import bcrypt from 'bcryptjs';

const password = 'Admin@123';

const passwordHash = bcrypt.hashSync(password, 10);
console.log(passwordHash);