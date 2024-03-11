import antlr4, {InputStream, CommonTokenStream} from 'antlr4';
import JavaScriptLexer from './antlr/gen/ECMAScriptLexer.js';
import JavaScriptParser from './antlr/gen/ECMAScriptParser.js';
import JavaScriptVisitor from "./antlr/gen/CalculatorVisitor.js";
const input = "1+1;"
var chars = new InputStream(input);
var lexer = new JavaScriptLexer(chars);
var tokens  = new CommonTokenStream(lexer);
var parser = new JavaScriptParser(tokens);
parser.buildParseTrees = true;
const tree = parser.singleExpression()
// console.log(tree.toStringTree(parser.ruleNames))


// 간단한 visitor를 사용하여 파싱된 결과를 얻을 수 있습니다.
class MyVisitor extends JavaScriptVisitor  {
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
const visitor = new JavaScriptVisitor();
const result = visitor.visit(tree);
console.log(`Result: ${result}`);