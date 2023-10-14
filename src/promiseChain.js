const promiseChain = (arr, args) => {
    if (arr.length === 1) {
        return arr[0];
    }

    return arr[0](...args).then(() => promiseChain(arr.slice(1)))
}