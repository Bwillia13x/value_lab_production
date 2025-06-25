"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasPermission = hasPermission;
const react_1 = require("next-auth/react");
const supabase_js_1 = require("@supabase/supabase-js");
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function hasPermission(req, requiredRole) {
    const session = await (0, react_1.getSession)({ req });
    if (!session?.user)
        return false;
    const { user } = session;
    if (user.role === 'admin')
        return true;
    if (user.role === requiredRole)
        return true;
    // Check for hierarchical permissions
    let currentUser = user;
    while (currentUser.parent_id) {
        const { data: parentUser, error } = await supabase
            .from('users')
            .select('role, parent_id')
            .eq('id', currentUser.parent_id)
            .single();
        if (error) {
            console.error('Error fetching parent user:', error);
            return false;
        }
        if (parentUser.role === 'admin')
            return true;
        if (parentUser.role === requiredRole)
            return true;
        currentUser = parentUser;
    }
    return false;
}
