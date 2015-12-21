export default function trust(value) {
    value = new String(value);
    value.$trusted = true;
    return value;
};
