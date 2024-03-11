// Calculator.g4
grammar Calculator;

expression : term ( ( '+' | '-' ) term )* ;
term       : factor ( ( '*' | '/' ) factor )* ;
factor     : NUMBER | '(' expression ')' ;

NUMBER     : [0-9]+ ;
WS         : [ \t\r\n]+ -> skip ;