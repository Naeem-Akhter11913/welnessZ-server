const bcrypt = require('bcryptjs');

async function hashPassword(password,salt) {
    try {
      
      // Hash the password with the salt
      const hashedPassword = await bcrypt.hash(password, salt);
  
      return hashedPassword;
    } catch (error) {
      return false
    }
  }

  module.exports = hashPassword