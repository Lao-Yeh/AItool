/*
 * Supabase 設定
 * 請將下列兩個值替換成 Supabase 專案的公開設定。
 * 只能填入 Publishable key／anon public key，不要填入 Secret key／service_role key。
 */
const SUPABASE_CONFIG = {
    url: 'https://xbxxmjbtxqxfsnlnaysd.supabase.co',
    anonKey: 'sb_publishable_9mQR1MO96iC2IXXzBiwUWQ_mWdrmDTf',
    table: 'toolbox_data',
    rowId: 1,
    // v1.2 簡易防誤刪密碼：請自行替換，不要使用預設文字。
    deletePassword: '0933837068'
};

const SUPABASE_ENABLED =
    SUPABASE_CONFIG.url.startsWith('https://') &&
    !SUPABASE_CONFIG.url.includes('你的專案ID') &&
    SUPABASE_CONFIG.anonKey.length > 30 &&
    !SUPABASE_CONFIG.anonKey.includes('請貼上');

const DELETE_PASSWORD_CONFIGURED =
    typeof SUPABASE_CONFIG.deletePassword === 'string' &&
    SUPABASE_CONFIG.deletePassword.length >= 6 &&
    !SUPABASE_CONFIG.deletePassword.includes('請自行設定');

const SUPABASE_DELETE_PASSWORD = SUPABASE_CONFIG.deletePassword;

// 注意：// 這裡的 deletePassword 是前端簡易防誤刪設定，不是高強度安全驗證。若要真正限制管理員權限，日後應改用 Supabase Auth 與 RLS。
