export { round, mod }
function round(v) { return Math.sign(v) * Math.round(Math.abs(v)); }
function mod(v, m) {
    return ((v % m) + m) % m;
}