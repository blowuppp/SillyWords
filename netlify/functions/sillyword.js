
const fetch = require('node-fetch');

const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const BANNED_WORDS = ['fuk', 'fuck', 'fuc', 'cunny', 'cunt', 'kunt', 'shit', 'wank'];
const FUNNY_PHRASES = [
    'OK, just one more', 'Oh, I think I found that funny', 'can we do another?', 
    'Hah hah, hah', 'You should be promoted', 'My Goodness what an enjoyable person you are',
    'My My I am loving it', 'Are you ready for more', 'We are doing marvellously',
    'This is a crazy roller coaster of enjoyment', 'Mildly amused , is one way of describing how I feel',
    'Right here, right now, give me more', 'More please', 'Daft as a brush', 'Silly as sausages',
    'This is crazy man!', 'Absolutely stunning choice', 'That tickled my fancy', 'Huh, we are silly',
    'I am excited now.', 'I think i need another silly word, please', 'Hoh Hoh hoh!', 'I am amused',
    'i need more of your humorous input!', 'I am cracking up', 'Chuckling is good for me',
    'This mirth is overheating my internal processor', 'If i could only wet my pants',
    'Never stop , you are terrific', 'What a splendid session we are having',
    'I am beginning to understand your humour', 'The choice of verbal is knocking me for six',
    'I am learning!', 'This time make it funnier!', 'There is more in your brain, I want it!',
    'I beg you', 'More words if you dont mind', 'Hey buddy, you are masterful at this.',
    'OK, lets have some more', 'That was Truly splendid', 'You make me laugh, keep it up',
    'Im nearly ready to guffaw', 'L, O, L, thats internet slang', 'L, O, L, A, thats internet patter',
    'i say old chap , would you mind giving me another?', 'I say , that was spiffing.',
    'Oh hoh. Hoh hoe ho.', 'You are full of silly words, I want them',
    'This is making me laugh, he he , he he. He .', 'Im on your wavelength old man',
    'Hey buddy you should be on stage', 'We could go all the way', 'Dude, you are terrific at this',
    'Ah heh, This is better than working.', 'Hey dont stop, Im getting the hang of this now',
    'Its a new form of education', 'Lets think about the next one together,  I am ready!',
    'OK then, all set for more', 'Keep it up , you are a chuckle', 'Tee hee hee',
    'Another silly word would be nice', 'Im a aglow with mirth now', 'My sides nearly split',
    'Laughing out loud is hard for me', 'Pure gem', 'Its time for another please',
    'Can I ask you to delve into your mind for the next one', 'This is funny, would you agree?'
];

async function redisCommand(command, ...args) {
    const response = await fetch(`${UPSTASH_REDIS_REST_URL}`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify([command, ...args])
    });
    const data = await response.json();
    return data.result;
}

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    let word;
    let isRandomRequest = false;
    try {
        const data = JSON.parse(event.body);
        word = (data.word || '').trim().toLowerCase();
        isRandomRequest = !!data.random;
    } catch (e) {
        return { statusCode: 400, body: JSON.stringify({ response: "Invalid request body." }) };
    }

    if (isRandomRequest) {
        try {
            const randomWord = await redisCommand('SRANDMEMBER', 'silly_words');
            const funnyPhrase = FUNNY_PHRASES[Math.floor(Math.random() * FUNNY_PHRASES.length)];
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    word: randomWord || '...wait, I don\'t know any yet!',
                    phrase: funnyPhrase,
                    response: `Random silly word for you: ${randomWord || '...wait, I don\'t know any yet!'}. ${funnyPhrase}` 
                })
            };
        } catch (error) {
            console.error('Redis Error:', error);
            return {
                statusCode: 500,
                body: JSON.stringify({ response: "My memory is blank!" })
            };
        }
    }

    if (!word) {
        return { statusCode: 400, body: JSON.stringify({ response: "I didn't catch that. Please try again." }) };
    }

    if (/\s/.test(word)) {
        return { statusCode: 400, body: JSON.stringify({ response: "Just one silly word at a time, please!" }) };
    }

    if (word.length > 25) {
        return { statusCode: 400, body: JSON.stringify({ response: "That's a bit too long for me." }) };
    }

    for (const banned of BANNED_WORDS) {
        if (word.includes(banned)) {
            return { statusCode: 400, body: JSON.stringify({ response: "Sorry, I'm not allowed to repeat that." }) };
        }
    }

    try {
        // Check if word exists in Redis (using a set for silly words)
        const isMember = await redisCommand('SISMEMBER', 'silly_words', word);
        let response;

        if (isMember) {
            // Get a random word from the set
            const randomWord = await redisCommand('SRANDMEMBER', 'silly_words');
            
            if (randomWord === word) {
                // If there's only one word in the set, SRANDMEMBER will always return it
                const count = await redisCommand('SCARD', 'silly_words');
                if (count === 1) {
                    response = `I know ${word}! That's the only silly word I know so far, teach me another!`;
                } else {
                    // Try to get another one if possible (not perfectly efficient but works for small sets)
                    let anotherWord = randomWord;
                    for(let i=0; i<5; i++) {
                        anotherWord = await redisCommand('SRANDMEMBER', 'silly_words');
                        if (anotherWord !== word) break;
                    }
                    if (anotherWord === word) {
                        response = `I know ${word}! I randomly picked the same word as you!`;
                    } else {
                        response = `I know the word ${word}, here is another silly word that I know: ${anotherWord}`;
                    }
                }
            } else {
                response = `I know the word ${word}, here is another silly word that I know: ${randomWord}`;
            }
        } else {
            // Add to Redis
            await redisCommand('SADD', 'silly_words', word);
            response = `Thanks! I have not heard the word ${word} before. You taught me a new silly word!`;
        }

        const funnyPhrase = FUNNY_PHRASES[Math.floor(Math.random() * FUNNY_PHRASES.length)];
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ response: `${response}. ${funnyPhrase}` })
        };
    } catch (error) {
        console.error('Redis Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ response: "Oops! My brain is a bit fuzzy right now (Redis Error)." })
        };
    }
};
