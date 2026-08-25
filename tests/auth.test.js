import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

import app from "../src/app.js";
import pool from "../src/config/db.js";

const loginTestUser = {
    name: "Login Test User",
    email: "login-test@example.com",
    password: "Password123"
};

const adminTestUser = {
    name: "Admin Test User",
    email: "admin-test@example.com",
    password: "Password123"
};

let loginTestUserId;
let adminTestUserId;

before(async () => {
    await pool.query(
        `DELETE FROM users
         WHERE email IN ($1, $2)`,
        [
            loginTestUser.email,
            adminTestUser.email
        ]
    );

    const userResponse = await request(app)
        .post("/api/auth/register")
        .send(loginTestUser);

    assert.equal(userResponse.statusCode, 201);

    loginTestUserId = userResponse.body.id;

    const adminResponse = await request(app)
        .post("/api/auth/register")
        .send(adminTestUser);

    assert.equal(adminResponse.statusCode, 201);

    adminTestUserId = adminResponse.body.id;

    await pool.query(
        `UPDATE users
         SET role = 'admin'
         WHERE email = $1`,
        [adminTestUser.email]
    );
});

after(async () => {
    await pool.query(
        `DELETE FROM users
         WHERE email IN (
             'testuser@example.com',
             'login-test@example.com',
             'admin-test@example.com',
             'duplicate@example.com',
             'role-injection@example.com',
             'casetest@example.com'
         )`
    );

    await pool.end();
});


test("POST /api/auth/register - should register a new user", async () => {
    const email = "testuser@example.com";

    const response = await request(app)
        .post("/api/auth/register")
        .send({
            name: "Test User",
            email,
            password: "Password123"
        });

    assert.equal(response.statusCode, 201);

    assert.equal(response.body.name, "Test User");
    assert.equal(response.body.email, email);
    assert.equal(response.body.role, "user");

    assert.ok(response.body.id);
    assert.ok(response.body.created_at);
    assert.ok(response.body.updated_at);

    assert.equal(response.body.password_hash, undefined);
});


test("POST /api/auth/register - should reject missing fields", async () => {
    const response = await request(app)
        .post("/api/auth/register")
        .send({});

    assert.equal(response.statusCode, 400);
});


test("POST /api/auth/register - should reject invalid email", async () => {
    const response = await request(app)
        .post("/api/auth/register")
        .send({
            name: "Test User",
            email: "not-an-email",
            password: "Password123"
        });

    assert.equal(response.statusCode, 400);
});


test("POST /api/auth/register - should reject short password", async () => {
    const response = await request(app)
        .post("/api/auth/register")
        .send({
            name: "Test User",
            email: "shortpass@example.com",
            password: "123"
        });

    assert.equal(response.statusCode, 400);
});


test("POST /api/auth/register - should reject invalid name", async () => {
    const response = await request(app)
        .post("/api/auth/register")
        .send({
            name: "A",
            email: "invalidname@example.com",
            password: "Password123"
        });

    assert.equal(response.statusCode, 400);
});


test("POST /api/auth/register - should reject duplicate email", async () => {
    const email = "duplicate@example.com";

    const first = await request(app)
        .post("/api/auth/register")
        .send({
            name: "First User",
            email,
            password: "Password123"
        });

    assert.equal(first.statusCode, 201);

    const second = await request(app)
        .post("/api/auth/register")
        .send({
            name: "Second User",
            email,
            password: "Password123"
        });

    assert.equal(second.statusCode, 409);
});


test("POST /api/auth/register - should not allow role injection", async () => {
    const email = "role-injection@example.com";

    const response = await request(app)
        .post("/api/auth/register")
        .send({
            name: "Test User",
            email,
            password: "Password123",
            role: "admin"
        });

    assert.equal(response.statusCode, 201);
    assert.equal(response.body.role, "user");
});


test("POST /api/auth/register - should reject case-insensitive duplicate email", async () => {
    const email = "CaseTest@example.com";

    const first = await request(app)
        .post("/api/auth/register")
        .send({
            name: "First User",
            email,
            password: "Password123"
        });

    assert.equal(first.statusCode, 201);

    const second = await request(app)
        .post("/api/auth/register")
        .send({
            name: "Second User",
            email: "casetest@example.com",
            password: "Password123"
        });

    assert.equal(second.statusCode, 409);
});


/*
 * LOGIN TESTS
 */
test("POST /api/auth/login - should login with valid credentials", async () => {
    const response = await request(app)
        .post("/api/auth/login")
        .send({
            email: loginTestUser.email,
            password: loginTestUser.password
        });

    assert.equal(response.statusCode, 200);

    assert.ok(response.body.accessToken);
    assert.ok(response.body.refreshToken);
});


test("POST /api/auth/login - should reject wrong password", async () => {
    const response = await request(app)
        .post("/api/auth/login")
        .send({
            email: loginTestUser.email,
            password: "WrongPassword123"
        });

    assert.equal(response.statusCode, 401);
});


test("POST /api/auth/login - should reject unknown email", async () => {
    const response = await request(app)
        .post("/api/auth/login")
        .send({
            email: "doesnotexist@example.com",
            password: "Password123"
        });

    assert.equal(response.statusCode, 401);
});


test("POST /api/auth/login - should reject missing credentials", async () => {
    const response = await request(app)
        .post("/api/auth/login")
        .send({});

    assert.equal(response.statusCode, 400);
});

test("GET /api/users/me - should return current user with valid access token", async () => {
    const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
            email: loginTestUser.email,
            password: loginTestUser.password
        });

    assert.equal(loginResponse.statusCode, 200);

    const { accessToken } = loginResponse.body;

    const response = await request(app)
        .get("/api/users/me")
        .set("Authorization", `Bearer ${accessToken}`);

    assert.equal(response.statusCode, 200);

    assert.equal(response.body.email, loginTestUser.email);
    assert.equal(response.body.name, loginTestUser.name);

    assert.equal(response.body.password_hash, undefined);
});

test("GET /api/users/me - should reject missing authorization", async () => {
    const response = await request(app)
        .get("/api/users/me");

    assert.equal(response.statusCode, 401);
});

test("GET /api/users/me - should reject invalid token", async () => {
    const response = await request(app)
        .get("/api/users/me")
        .set("Authorization", "Bearer invalid-token");

    assert.equal(response.statusCode, 401);
});

test("GET /api/users/me - should reject malformed authorization header", async () => {
    const response = await request(app)
        .get("/api/users/me")
        .set("Authorization", "Basic sometoken");

    assert.equal(response.statusCode, 401);
});

test("GET /api/users/me - should reject missing bearer token", async () => {
    const response = await request(app)
        .get("/api/users/me")
        .set("Authorization", "Bearer");

    assert.equal(response.statusCode, 401);
});

test("GET /api/admin/users/:id - should reject normal user", async () => {
    const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
            email: loginTestUser.email,
            password: loginTestUser.password
        });

    assert.equal(loginResponse.statusCode, 200);

    const { accessToken } = loginResponse.body;

    const response = await request(app)
        .get(`/api/admin/users/${loginTestUserId}`)
        .set("Authorization", `Bearer ${accessToken}`);

    assert.equal(response.statusCode, 403);
});

test("GET /api/admin/users/:id - should allow admin", async () => {
    const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
            email: adminTestUser.email,
            password: adminTestUser.password
        });

    assert.equal(loginResponse.statusCode, 200);

    const { accessToken } = loginResponse.body;

    const response = await request(app)
        .get(`/api/admin/users/${loginTestUserId}`)
        .set("Authorization", `Bearer ${accessToken}`);

    assert.equal(response.statusCode, 200);

    assert.equal(response.body.user.email, loginTestUser.email);
});

test("GET /api/admin/users/:id - should reject unauthenticated request", async () => {
    const response = await request(app)
        .get(`/api/admin/users/${loginTestUserId}`);

    assert.equal(response.statusCode, 401);
});