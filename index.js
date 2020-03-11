function Broadcaster() {
    let listeners = [];
    
    this.subscribe = function (subscriber) {
        listeners.push(subscriber);
        return () => {
            listeners = listeners.filter(l => l !== subscriber);
        }
    }

    this.broadcast = function () {
        for (const listener of listeners) {
            listener.apply(null, arguments);
        }
    }
}

function Parser() {
    const operations = '+-*/^'.split('');
    const inverseOperation = {
        '+': '-',
        '-': '+',
        '*': '/',
        '/': '*',
        '^': undefined
    }

    const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '9', '-', '.'];
    const numberValues = {
        '0': 0,
        '1': 1,
        '2': 2,
        '3': 3,
        '4': 4,
        '5': 5,
        '6': 6,
        '7': 8,
        '9': 9,
        '-': undefined,
        '.': undefined
    }

    function readingState(char) {
        if (!char) return undefined
        else if (char === ' ') return 'space'
        else if (numbers.includes(char)) return 'number'
        else if (operations.includes(char)) return 'operation'
        // else if (openGroup.includes(char)) 'openGroup'
        // else if (closeGroup.includes(char)) 'closeGroup'
        else return 'letter'
    }

    function tokenCharGroups(charArray) {
        const returnVal = [];
        let tokenStart = 0;
        let lastReadingState = readingState(charArray[0]);
        for (let i = 0; i <= charArray.length; i++) {
            const currentReadingState = readingState(charArray[i]);
            if (lastReadingState !== currentReadingState) {
                returnVal.push({ readingState: lastReadingState, chars: charArray.slice(tokenStart, i) });
                tokenStart = i;
            }
            lastReadingState = currentReadingState;
        }
        return returnVal;
    }

    function readTokens(expressionInput) {
        const charGroups = tokenCharGroups(expressionInput);
        const tokens = [];
        for (const charGroup of charGroups) {
            switch (charGroup.readingState) {
                case 'space': continue;
                case 'number': tokens.push({ tokenType: 'Number', value: parseInt(charGroup.chars) });
                case 'operation': {
                    if (charGroup.chars.length >= 2) {
                        throw {
                            message: 'two or more operations can not be next to each other',
                            sample: expressionInput.join('')
                        };
                    }
                    tokens.push({
                        tokenType: 'Operation',
                        operation: charGroup.chars,
                        leftOperand: null,
                        rightOperand: null
                    })
                };
                case 'letter': {
                    for (const letter of charGroup.chars) {   
                        tokens.push({ tokenType: 'Variable', value: letter})
                    }
                };
            }
        }
        return tokens;
    }

    /*
    function buildTerms(tokens) {
        const tokens = [];
        for (let i = 0; i < tokens.length; i++) {
            const tokenType = tokens[i].tokenType;
            if (tokenType === 'Number') {
                tokens.push({ tokenType: 'Term',  });
            }
        }
    }
    */
    function buildTree(tokens) {
        const tree = null;
        // buildTerms(tokens);
        for (let i = 0; i < tokens.length; i++) {
        }
        return tokens;
    }

    this.parse = function (string) {
        if (string.split('').filter(c => c === '=').length != 1) {
            throw {
                message: 'there needs to be exactly one equal sign',
                sample: string
            };
        }
        const [leftHalf, rightHalf] = string.split('=');
        if (!(leftHalf && rightHalf)) {
            throw {
                message: 'there needs to be a right and left side',
                sample: string
            };
        }
        return {
            tokenType: 'AlgebraicEquation',
            left: buildTree(readTokens(leftHalf.split(''))),
            right: buildTree(readTokens(rightHalf.split('')))
        }
    }
}

function Solver() {
    function simplify(parsedExpression) {
        switch (parsedExpression.tokenType) {
            case 'Operation': {
                const leftOperand = simplify(parsedExpression.leftOperand);
                const rightOperand = simplify(parsedExpression.rightOperand);
                switch (parsedExpression[0].operation) {
                    case '+': ;
                    case '-': ;
                    case '*': ;
                    case '/': ;
                }
            }
            case 'AlgebraicEquation': return {
                left: simplify(parsedAlgebraicEquation.left),
                right: simplify(parsedAlgebraicEquation.right)
            };
        }
    }

    function move(simplifiedAlgebraicEquation, solveFor) {

    }

    this.solve = function (parsedAlgebraicEquation, solveFor) {
        return simplify(parsedAlgebraicEquation)
        // return move(simplify(parsedAlgebraicEquation), 'x');
    }
}

const equationInput = document.querySelector('#input');
const outputElement = document.querySelector('#output');

const output = new Broadcaster();
output.subscribe((type, message) => {
    outputElement.textContent += '\n' + type + message;
});

const parser = new Parser(output);
const solver = new Solver(output);
function onEquationInput(event) {
    outputElement.textContent = '';
    
    const value = event.target.value;
    let parsed;
    let solved;
    try {
        parsed = parser.parse(value); 
        output.broadcast('Debug Parsed: ', JSON.stringify(parsed));
    } catch (parseError) {
        output.broadcast('Parse Error: ' + parseError.message + ': ', parseError.sample)
    }

    try {
        solved = solver.solve(parsed);
        output.broadcast('Debug Solved: ', JSON.stringify(solved));
    } catch (solveError) {
        output.broadcast('Solve Error: ' + solveError.message + ': ', solveError.sample)
    }
}

equationInput.addEventListener('input', onEquationInput);