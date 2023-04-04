import type { TUser } from "../types/users";
import { handlePatchSetQuery } from "../utils/handleQueryFormat";
import pool from "../utils/pool";
import Repo from "./Repo";

const handleSelectTestEnv = () => {
  if (process.env.NODE_ENV === "test") {
    return ", login_passcode, one_time_password";
  }

  return "";
};

const repo = new Repo<TUser>("users", [
  "id",
  "created_at",
  "updated_at",
  "first_name",
  "last_name",
  "middle_name",
  "nickname",
  "email",
  "phone",
  { env: ["test"], value: "one_time_password" },
  { env: ["test"], value: "login_passcode" },
]);
class UserRepo {
  static async find(payload?: Partial<TUser>) {
    const rows = await repo.find(payload);
    return rows;
  }

  static async createOne(payload: TUser) {
    const { rows } = await pool.query(
      `
      INSERT INTO users (
        first_name,
        last_name,
        middle_name,
        nickname,
        phone,
        email,
        login_passcode
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING id,
        created_at,
        updated_at,
        first_name,
        last_name,
        middle_name,
        nickname,
        email
        ${handleSelectTestEnv()};
    `,
      [
        payload.first_name,
        payload.last_name,
        payload.middle_name,
        payload.nickname,
        payload.phone,
        payload.email,
        payload.login_passcode,
      ]
    );

    return rows[0];
  }

  static async updateOneById(
    id: string,
    payload: Partial<Pick<TUser, "nickname" | "email" | "one_time_password" | "login_passcode">>
  ) {
    const { q, queryDeps } = handlePatchSetQuery(id, payload, [
      "email",
      "nickname",
      "one_time_password",
      "login_passcode",
    ]);

    const { rows } = await pool.query(
      `
      UPDATE users
      SET ${q}
      WHERE users.id = $1
      RETURNING id,
        created_at,
        updated_at,
        first_name,
        last_name,
        middle_name,
        nickname,
        email
        ${handleSelectTestEnv()};
    `,
      queryDeps
    );

    return rows[0];
  }

  static async deleteOneById(id: string) {
    const { rows } = await pool.query(
      `
      DELETE FROM users
      WHERE users.id = $1
      RETURNING id,
        created_at,
        updated_at,
        first_name,
        last_name,
        middle_name,
        nickname,
        email
        ${handleSelectTestEnv()};
    `,
      [id]
    );

    return rows[0];
  }

  static async count() {
    const { rows } = await pool.query(`SELECT COUNT(*) FROM users;`);

    return +rows[0].count;
  }
}

export default UserRepo;
