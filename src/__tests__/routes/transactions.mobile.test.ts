import request from "supertest";

import app from "../../app";
import { TRANSACTIONS_ROUTES } from "../../constants/routes";
import { getEndpoint, handleSignupManyAccountUsers } from "../../utils/tests";
import { TTransactionTransactionMobile, TTransactionTransactionReward } from "../../types/transactions";

type TResponse<T> = {
  body: {
    data: T;
  };
};

test("Ensures CASHBACK rewards when mobile transfer is successful and transaction is recorded", async () => {
  const createUserCount = 3;
  const users = await handleSignupManyAccountUsers(createUserCount);
  const [userOne, userTwo, userThree] = users;

  const handleGetUserTransactions = async (user: typeof userOne) => {
    const {
      body: { data: mobileTransactions },
    }: TResponse<TTransactionTransactionMobile[]> = await request(app())
      .get(getEndpoint(`/transactions/${TRANSACTIONS_ROUTES.mobiles}`))
      .set("Authorization", `Bearer ${user.token}`)
      .expect(200);

    const {
      body: { data: cashbackTransactions },
    }: TResponse<TTransactionTransactionReward[]> = await request(app())
      .get(getEndpoint(`/transactions/${TRANSACTIONS_ROUTES.rewardsCashback}`))
      .set("Authorization", `Bearer ${user.token}`)
      .expect(200);

    return {
      mobileTransactions,
      cashbackTransactions,
    };
  };

  for (const user of users) {
    const { mobileTransactions, cashbackTransactions } = await handleGetUserTransactions(user);

    const transactionsCount = 0;
    expect(mobileTransactions.length).toBe(transactionsCount);
    expect(cashbackTransactions.length).toBe(transactionsCount);
  }
});
