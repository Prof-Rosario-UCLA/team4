import {
  jest,
  describe,
  test,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { handleLogin } from "./authController.js";
import User from "../model/user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// Helper function to make a mock response object
function makeMockResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.sendStatus = jest.fn().mockReturnValue(res);

  return res;
}

describe("Login Tests", () => {
  let req, res;

  // Set up before every single test in the describe block
  beforeEach(() => {
    req = {
      body: { user: "testuser", pwd: "password123" },
    };
    res = makeMockResponse();
  });

  // Clean up jest mocks after every test
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("Login should return access token and set cookie if password matches", async () => {
    const fakeUser = {
      username: "testuser",
      password: "hashedpassword", // this value doesn't matter due to the mock below
      _id: { toString: () => "123abc" },
      save: jest.fn(),
    };

    jest.spyOn(User, "findOne").mockResolvedValue(fakeUser);

    jest.spyOn(bcrypt, "compare").mockResolvedValue(true);

    jest.spyOn(jwt, "sign").mockImplementation((payload, secret, options) => {
      if (options.expiresIn === "30m") return "access-token";
      if (options.expiresIn === "1d") return "refresh-token";
    });

    await handleLogin(req, res);

    expect(res.json).toHaveBeenCalledWith({ accessToken: "access-token" });
    expect(res.cookie).toHaveBeenCalledWith(
      "jwt",
      "refresh-token",
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        maxAge: 5000,
      })
    );

    // Should not call any sendStatus if success
    expect(res.sendStatus).not.toHaveBeenCalled();
  });
});
