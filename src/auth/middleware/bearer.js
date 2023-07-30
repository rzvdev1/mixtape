'use strict';

const { users } = require('../../models');

module.exports = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      _authError();
    }

    const token = req.headers.authorization.split(' ').pop();
    const validUser = await users.authenticateToken(token);
    req.user = validUser;
    req.token = validUser.token;
    console.log('I am the bearer',req.user);
    next();
  } catch (e) {
    _authError();
  }

  function _authError() {
    next('Invalid Login');
  }
};
