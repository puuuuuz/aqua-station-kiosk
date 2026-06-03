const onHr = 18;
const offHr = 6;
const hour = 17;
let shouldBeOn = false;
if (onHr > offHr) {
    shouldBeOn = (hour >= onHr || hour < offHr);
} else {
    shouldBeOn = (hour >= onHr && hour < offHr);
}
console.log("shouldBeOn for hour", hour, ":", shouldBeOn);
