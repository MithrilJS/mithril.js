function trust(value) {
    /*eslint no-new-wrapper:0 */
    value = new String(value);
    value.$trusted = true;
    return value;
}

export {trust};
