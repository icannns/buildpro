// Role definitions and permissions
const ROLES = {
    ADMIN: 'ADMIN',
    PROJECT_MANAGER: 'PROJECT_MANAGER',
    VENDOR: 'VENDOR',
    VIEWER: 'VIEWER'
};

// Permission mapping
const PERMISSIONS = {
    [ROLES.ADMIN]: [
        'projects:read',
        'projects:write',
        'projects:delete',
        'materials:read',
        'materials:write',
        'materials:delete',
        'payments:read',
        'payments:write',
        'payments:delete',
        'users:read',
        'users:write',
        'users:delete'
    ],
    [ROLES.PROJECT_MANAGER]: [
        'projects:read',
        'projects:write',
        'materials:read',
        'materials:write',
        'payments:read',
        'payments:write'
    ],
    [ROLES.VENDOR]: [
        'materials:read',
        'materials:update_price'
    ],
    [ROLES.VIEWER]: [
        'projects:read',
        'materials:read',
        'payments:read'
    ]
};

// Check if role has permission
function hasPermission(role, permission) {
    const rolePermissions = PERMISSIONS[role] || [];
    return rolePermissions.includes(permission);
}

// Get all permissions for a role
function getRolePermissions(role) {
    return PERMISSIONS[role] || [];
}

module.exports = {
    ROLES,
    PERMISSIONS,
    hasPermission,
    getRolePermissions
};
