function unless(condition, a, b) {
    return a ? b : a;
}

function factorial(n) {
    console.log(`factorial ${n}`)
    return unless(n > 1, n * factorial(n - 1), 1)
}

factorial(5)
// 5 * factorial(4)
// 4 * factorial(3)
// 3 * factorial(2)
// 2 * factorial(1)
// 1 * factorial(0) <- 여기도 평가되어 버린다.


