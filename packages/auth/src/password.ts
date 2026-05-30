/** Password & secret hashing (bcrypt, pure-JS). Used for user passwords and the
 *  manual-price override secret. Pure JS keeps it portable across Node/runtimes
 *  with no native build step. */
import bcrypt from "bcryptjs";

const ROUNDS = 10;

export function hashSecret(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifySecret(hash: string, plain: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}
