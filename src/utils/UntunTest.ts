import { startTunnel } from 'untun';

export async function testUntun() {
    console.log("Testing untun import...");
    try {
        // Just checking if it compiles and we can reference it
        console.log("Untun imported successfully");
    } catch (e) {
        console.error("Untun import failed", e);
    }
}
