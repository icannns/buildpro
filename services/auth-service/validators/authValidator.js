const Joi = require('joi');

// User registration validation
const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().min(2).max(255).required(),
    role: Joi.string().valid('ADMIN', 'PROJECT_MANAGER', 'VENDOR', 'VIEWER').default('VIEWER')
});

// User login validation
const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

// Password change validation
const changePasswordSchema = Joi.object({
    old_password: Joi.string().required(),
    new_password: Joi.string().min(6).required()
});

module.exports = {
    registerSchema,
    loginSchema,
    changePasswordSchema
};
