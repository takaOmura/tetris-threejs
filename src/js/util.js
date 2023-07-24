export { round, mod }
function round(v, d) { return Math.sign(v) * Math.round(Math.abs(v * Math.pow(10, d))) / Math.pow(10, d); }
function mod(v, m) {
    return ((v % m) + m) % m;
}