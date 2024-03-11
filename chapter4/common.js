
let cons = (x,y) => [x,y];
let car = (pair) => pair[0];
let cdr = (pair) => pair[1];
//Nil definition
let nil = [];
let isNil = (obj) => obj==null || (Array.isArray(obj) && obj.length===0);
//Helper procedure to build, extract, compare and print list
let cadr = (pair) => car(cdr(pair));
export const list = (...args) => {
    if(args.length > 1) return cons(args[0], list(...args.slice(1)));
    else if(args.length === 0) return nil;
    else return cons(args[0], nil);
};
let isEqual = (seq1, seq2) => JSON.stringify(seq1)===JSON.stringify(seq2);
let print = (seq) => JSON.stringify(seq);
//List operations
let listRef = (seq, n) => {
    if(n===0) return car(seq);
    else return listRef(cdr(seq), n-1);
};
let length = (seq) => {
    let lengthIter = (s, count) => {
        if(isNil(s)) return count;
        else return lengthIter(cdr(s), count+1);
    };
    return lengthIter(seq, 0);
};
let append = (list1, list2) => {
    if(isNil(list1)) return list2;
    else return cons(car(list1), append(cdr(list1), list2));
};
