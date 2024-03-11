import antlr4 from 'antlr4';
import CalculatorLexer from './antlr/gen/CalculatorLexer.js';
import CalculatorParser from './antlr/gen/CalculatorParser.js';
import CalculatorVisitor from './antlr/gen/CalculatorVisitor.js';

// 입력 수식
const input = '3 + 5 * ( 2 - 1 )';

// 입력 문자열을 ANTLR 렉서로 변환
const chars = new antlr4.InputStream(input);
const lexer = new CalculatorLexer(chars);
const tokens = new antlr4.CommonTokenStream(lexer);

// 파서 생성 및 트리 생성
const parser = new CalculatorParser(tokens);
parser.buildParseTrees = true;
const tree = parser.expression();

// 트리를 출력하여 확인 (optional)
console.log(tree.toStringTree(parser.ruleNames));

// 간단한 visitor를 사용하여 파싱된 결과를 얻을 수 있습니다.
class MyCalculatorVisitor extends CalculatorVisitor {
    visitNumber(ctx) {
        return parseInt(ctx.getText());
    }

    visitExpression(ctx) {
        if (ctx.children.length === 1) {
            return this.visit(ctx.getChild(0));
        }

        let left = this.visit(ctx.getChild(0));
        let right = this.visit(ctx.getChild(2));
        let operator = ctx.getChild(1).getText();

        if (operator === '+') {
            return left + right;
        } else if (operator === '-') {
            return left - right;
        } else if (operator === '*') {
            return left * right;
        } else if (operator === '/') {
            return left / right;
        }
    }
}

const visitor = new MyCalculatorVisitor();
const result = visitor.visit(tree);
console.log(`Result: ${result}`);