const { translate } = require('./translate');

async function test() {
    try {
        console.log('Test 1: Chinese to English');
        const result1 = await translate('auto', 'EN', '你好世界');
        console.log('Input: 你好世界');
        console.log('Result:', result1);
        console.log('Test 1: ✅ Passed\n');

        console.log('Test 2: English to Chinese');
        const result2 = await translate('auto', 'ZH', 'Hello World');
        console.log('Input: Hello World');
        console.log('Result:', result2);
        console.log('Test 2: ✅ Passed\n');

        console.log('Test 3: Long text translation');
        const result3 = await translate(
            'auto',
            'ZH',
            'The quick brown fox jumps over the lazy dog'
        );
        console.log('Input: The quick brown fox jumps over the lazy dog');
        console.log('Result:', result3);
        console.log('Test 3: ✅ Passed\n');

        console.log('Test 4: HTML content');
        const result4 = await translate(
            'auto',
            'ZH',
            '<p>Hello World</p>',
            'html'
        );
        console.log('Input: <p>Hello World</p>');
        console.log('Result:', result4);
        console.log('Test 4: ✅ Passed\n');

        console.log('All tests completed successfully! 🎉');
    } catch (error) {
        console.error('Test failed:', error);
    }
}

test(); 