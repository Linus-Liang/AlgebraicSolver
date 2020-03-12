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
    const operations = '+-*/^√'.split('');
    const inverseOperation = {
        '+': '-',
        '-': '+',
        '*': '/',
        '/': '*',
        '^': '√',
        '√': '^'
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

    const openGroup = '([{';
    const closeGroup = ')]}';

    function readingState(char) {
        if (!char) return undefined
        else if (char === ' ') return 'space'
        else if (numbers.includes(char)) return 'number'
        else if (operations.includes(char)) return 'operation'
        else if (openGroup.includes(char)) return 'openGroup'
        else if (closeGroup.includes(char)) return 'closeGroup'
        else return 'letter'
    }

    function groupChars(charArray) {
        const returnVal = [];
        let tokenStart = 0;
        let lastReadingState = readingState(charArray[0]);
        for (let i = 0; i <= charArray.length; i++) {
            const currentReadingState = readingState(charArray[i]);
            if (lastReadingState !== currentReadingState) {
                returnVal.push({ readingState: lastReadingState, chars: charArray.slice(tokenStart, i) });
                tokenStart = i;
            }
            if (lastReadingState === 'openGroup' && currentReadingState !== 'closeGroup') continue; 
            lastReadingState = currentReadingState;
        }
        return returnVal;
    }

    function readTokens(expressionInput) {
        const charGroups = groupChars(expressionInput);
        const tokens = [];
        for (const charGroup of charGroups) {
            switch (charGroup.readingState) {
                case 'space': continue;
                case 'number': {
                    console.log(charGroup.chars.join(''));
                    tokens.push({ tokenType: 'Number', value: parseInt(charGroup.chars.join('')) });
                    continue;
                };
                case 'operation': {
                    if (charGroup.chars.length >= 2) {
                        throw {
                            message: 'two or more operations can not be next to each other',
                            sample: expressionInput.join('')
                        };
                    }
                    tokens.push({
                        tokenType: 'Operation',
                        operation: charGroup.chars[0],
                        leftOperand: null,
                        rightOperand: null
                    });
                    continue;
                };
                case 'letter': {
                    // if (tokens[tokens.length - 1] && tokens[tokens.length - 1].tokenType === 'Number') {
                    //     tokens.push({ tokenType: 'Term', coefficient: tokens.pop().value });
                    // }
                    for (const letter of charGroup.chars) {   
                        tokens.push({ tokenType: 'Variable', value: letter})
                    }
                    continue;
                };
                case 'closeGroup': {
                    tokens.push({ tokenType: 'Expression', tokenlist: readTokens(charGroup.chars) });
                    continue;
                }
            }
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
            left: { tokenType: 'Expression', tokenlist: readTokens(leftHalf.split('')) },
            right: { tokenType: 'Expression', tokenlist: readTokens(rightHalf.split('')) }
        }
    }
}

function Solver() {
    function simplify(parsed) {
        switch (parsed.tokenType) {
            case 'Operation': {
                const leftOperand = simplify(parsed.leftOperand);
                const rightOperand = simplify(parsed.rightOperand);
                switch (parsed[0].operation) {
                    case '+': ;
                    case '-': ;
                    case '*': ;
                    case '/': ;
                }
            }
            case 'AlgebraicEquation': return {
                left: simplify(parsed.left),
                right: simplify(parsed.right)
            };
        }
    }

    function move(simplifiedAlgebraicEquation, solveFor) {

    }

    this.solve = function (parsedAlgebraicEquation, solveFor) {
        return simplify(parsedAlgebraicEquation)
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

function fancyDisplay(parsed) {
    const spacing = '  ';
    let display = '';
    let indentLevel = 0;
    let suppressIndentChange = false;
    let suppressSpecial = false;
    const json = JSON.stringify(parsed).split('');
    for (let i = 0; i < json.length; i++) {
        const char = json[i];
        if (char === '"') {
            suppressSpecial = !suppressSpecial;
            display += '"';
        } else if (!suppressSpecial) {
            if (char === '[') {
                indentLevel++;
                suppressIndentChange = true;
                display += '[\n'+ spacing.repeat(indentLevel);
            } else if (char === ']') {
                indentLevel--;
                suppressIndentChange = false;
                display += '\n' + spacing.repeat(indentLevel) + ']';
            } else if (char === ':') {
                display += ': ';
            } else if (suppressIndentChange) {
                switch (char) {
                    case '{': display += '{ '; break;
                    case '}': display += ' }'; break;
                    case ',': display += ', '; break;
                    default: display += char; break;
                }
            } else if (!suppressIndentChange) {
                switch (char) {
                    case '{': indentLevel++; display += '{\n' + spacing.repeat(indentLevel); break;
                    case '}': indentLevel--; display += '\n' + spacing.repeat(indentLevel) + '}'; break;
                    case ',': display += ',\n' + spacing.repeat(indentLevel); break;
                    default: display += char; break;
                } 
            }
        } else display += char;
    }
    return display;
}

function onEquationInput(event) {
    outputElement.textContent = '';
    try {
        const value = event.target.value;
        const parsed = parser.parse(value); 
        output.broadcast('Debug Parsed: ', fancyDisplay(parsed));

        try {
            const solved = solver.solve(parsed);
            output.broadcast('Debug Solved: ', fancyDisplay(solved));
        } catch (solveError) {
            output.broadcast('Solve Error: ' + solveError.message + ': ', solveError.sample)
        }
    } catch (parseError) {
        output.broadcast('Parse Error: ' + parseError.message + ': ', parseError.sample)
    }
}

equationInput.addEventListener('input', onEquationInput);
