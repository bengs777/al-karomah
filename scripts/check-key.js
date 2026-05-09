const key = 'pk_test_cG9zc2libGUta2luZ2Zpc2gtNi5jbGVyay5hY2NvdW50cy5kZXYk';
const decoded = Buffer.from(key.split('_')[1], 'base64').toString();
console.log('Decoded Clerk key part:', decoded);
// The full key should be: pk_test_ + the decoded part
console.log('Full key format should be: pk_test_XXXX');
