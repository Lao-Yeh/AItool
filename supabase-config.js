/*
 * Supabase 設定
 * 請將下列兩個值替換成 Supabase 專案的公開設定。
 * 只能填入 anon public key，不要填入 service_role key。
 */
const SUPABASE_CONFIG = {
    url: 'https://xbxxmjbtxqxfsnlnaysd.supabase.co',
    anonKey: 'sb_publishable_9mQR1MO96iC2IXXzBiwUWQ_mWdrmDTf',
    table: 'toolbox_data',
    rowId: 1
};

const SUPABASE_ENABLED =
    SUPABASE_CONFIG.url.startsWith('https://') &&
    !SUPABASE_CONFIG.url.includes('你的專案ID') &&
    SUPABASE_CONFIG.anonKey.length > 30 &&
    !SUPABASE_CONFIG.anonKey.includes('請貼上');
