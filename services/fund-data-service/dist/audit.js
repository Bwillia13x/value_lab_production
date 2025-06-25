"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAuditEvent = logAuditEvent;
const supabase_js_1 = require("@supabase/supabase-js");
const react_1 = require("next-auth/react");
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function logAuditEvent(req, action, details) {
    const session = await (0, react_1.getSession)({ req });
    if (!session?.user)
        return;
    const { user } = session;
    const { organizationId } = user;
    await supabase.from('audit_logs').insert([
        {
            user_id: user.id,
            organization_id: organizationId,
            action,
            details,
        },
    ]);
}
