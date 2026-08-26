import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
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
const resetTestUser = {
    name: "Reset Test User",
    email: "reset-test@example.com",
    password: "Password123"
};

let resetTestUserId;
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

    const resetResponse = await request(app)
        .post("/api/auth/register")
        .send(resetTestUser);

    assert.equal(resetResponse.statusCode, 201);

    resetTestUserId = resetResponse.body.id;
});

after(async () => {
    await pool.query(
        `DELETE FROM users
         WHERE email IN (
             'testuser@example.com',
             'login-test@example.com',
             'admin-test@example.com',
             'reset-test@example.com',
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

test("POST /api/auth/login - should normalize email", async () => {
    const response = await request(app)
        .post("/api/auth/login")
        .send({
            email: `  ${adminTestUser.email.toUpperCase()}  `,
            password: adminTestUser.password
        });

    assert.equal(response.statusCode, 200);

    assert.ok(response.body.accessToken);
    assert.ok(response.body.refreshToken);
});

test("POST /api/auth/login - should reject invalid email", async () => {
    const response = await request(app)
        .post("/api/auth/login")
        .send({
            email: "not-an-email",
            password: "Password123"
        });

    assert.equal(response.statusCode, 400);
});

test("POST /api/auth/login - should reject non-string email", async () => {
    const response = await request(app)
        .post("/api/auth/login")
        .send({
            email: 12345,
            password: "Password123"
        });

    assert.equal(response.statusCode, 400);
});

test("POST /api/auth/login - should reject non-string password", async () => {
    const response = await request(app)
        .post("/api/auth/login")
        .send({
            email: adminTestUser.email,
            password: 12345678
        });

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

test("PATCH /api/admin/users/:id/role - should allow admin to update user role", async () => {
    const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
            email: adminTestUser.email,
            password: adminTestUser.password
        });

    assert.equal(loginResponse.statusCode, 200);

    const { accessToken } = loginResponse.body;

    const response = await request(app)
        .patch(`/api/admin/users/${loginTestUserId}/role`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
            role: "admin"
        });

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.user.role, "admin");

    await pool.query(
        `UPDATE users
         SET role = 'user'
         WHERE id = $1`,
        [loginTestUserId]
    );
});

test("PATCH /api/admin/users/:id/role - should reject normal user", async () => {
    const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
            email: loginTestUser.email,
            password: loginTestUser.password
        });

    assert.equal(loginResponse.statusCode, 200);

    const { accessToken } = loginResponse.body;

    const response = await request(app)
        .patch(`/api/admin/users/${adminTestUserId}/role`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
            role: "user"
        });

    assert.equal(response.statusCode, 403);
});

test("PATCH /api/admin/users/:id/role - should reject invalid role", async () => {
    const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
            email: adminTestUser.email,
            password: adminTestUser.password
        });

    assert.equal(loginResponse.statusCode, 200);

    const { accessToken } = loginResponse.body;

    const response = await request(app)
        .patch(`/api/admin/users/${loginTestUserId}/role`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
            role: "superadmin"
        });

    assert.equal(response.statusCode, 400);
});

test("PATCH /api/admin/users/:id/role - should return 404 for nonexistent user", async () => {
    const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
            email: adminTestUser.email,
            password: adminTestUser.password
        });

    assert.equal(loginResponse.statusCode, 200);

    const { accessToken } = loginResponse.body;

    const response = await request(app)
        .patch("/api/admin/users/999999/role")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
            role: "user"
        });

    assert.equal(response.statusCode, 404);
});

test("DELETE /api/admin/users/:id - should reject normal user", async () => {
    const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
            email: loginTestUser.email,
            password: loginTestUser.password
        });

    assert.equal(loginResponse.statusCode, 200);

    const { accessToken } = loginResponse.body;

    const response = await request(app)
        .delete(`/api/admin/users/${adminTestUserId}`)
        .set("Authorization", `Bearer ${accessToken}`);

    assert.equal(response.statusCode, 403);
});

test("DELETE /api/admin/users/:id - should return 404 for nonexistent user", async () => {
    const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
            email: adminTestUser.email,
            password: adminTestUser.password
        });

    assert.equal(loginResponse.statusCode, 200);

    const { accessToken } = loginResponse.body;

    const response = await request(app)
        .delete("/api/admin/users/999999")
        .set("Authorization", `Bearer ${accessToken}`);

    assert.equal(response.statusCode, 404);
});

test("DELETE /api/admin/users/:id - should reject invalid ID", async () => {
    const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
            email: adminTestUser.email,
            password: adminTestUser.password
        });

    assert.equal(loginResponse.statusCode, 200);

    const { accessToken } = loginResponse.body;

    const response = await request(app)
        .delete("/api/admin/users/abc")
        .set("Authorization", `Bearer ${accessToken}`);

    assert.equal(response.statusCode, 400);
});

test("DELETE /api/admin/users/:id - should reject unauthenticated request", async () => {
    const response = await request(app)
        .delete(`/api/admin/users/${adminTestUserId}`);

    assert.equal(response.statusCode, 401);
});

test("POST /api/auth/refresh - should rotate refresh token", async () => {
    const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
            email: adminTestUser.email,
            password: adminTestUser.password
        });

    assert.equal(loginResponse.statusCode, 200);

    const oldRefreshToken = loginResponse.body.refreshToken;

    assert.ok(oldRefreshToken);

    const response = await request(app)
        .post("/api/auth/refresh")
        .send({
            refreshToken: oldRefreshToken
        });

    assert.equal(response.statusCode, 200);

    assert.ok(response.body.accessToken);
    assert.ok(response.body.refreshToken);

    assert.notEqual(
        response.body.refreshToken,
        oldRefreshToken
    );
});

test("POST /api/auth/refresh - should reject reused refresh token", async () => {
    const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
            email: adminTestUser.email,
            password: adminTestUser.password
        });

    assert.equal(loginResponse.statusCode, 200);

    const oldRefreshToken = loginResponse.body.refreshToken;

    const firstRefresh = await request(app)
        .post("/api/auth/refresh")
        .send({
            refreshToken: oldRefreshToken
        });

    assert.equal(firstRefresh.statusCode, 200);

    const secondRefresh = await request(app)
        .post("/api/auth/refresh")
        .send({
            refreshToken: oldRefreshToken
        });

    assert.equal(secondRefresh.statusCode, 401);
});

test("POST /api/auth/refresh - should accept newly rotated refresh token", async () => {
    const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
            email: adminTestUser.email,
            password: adminTestUser.password
        });

    assert.equal(loginResponse.statusCode, 200);

    const firstRefreshToken = loginResponse.body.refreshToken;

    const firstRefresh = await request(app)
        .post("/api/auth/refresh")
        .send({
            refreshToken: firstRefreshToken
        });

    assert.equal(firstRefresh.statusCode, 200);

    const secondRefreshToken = firstRefresh.body.refreshToken;

    const secondRefresh = await request(app)
        .post("/api/auth/refresh")
        .send({
            refreshToken: secondRefreshToken
        });

    assert.equal(secondRefresh.statusCode, 200);
    assert.ok(secondRefresh.body.accessToken);
    assert.ok(secondRefresh.body.refreshToken);
});

test("POST /api/auth/refresh - should reject invalid refresh token", async () => {
    const response = await request(app)
        .post("/api/auth/refresh")
        .send({
            refreshToken: "invalid-refresh-token"
        });

    assert.equal(response.statusCode, 401);
});

test("POST /api/auth/refresh - should reject missing refresh token", async () => {
    const response = await request(app)
        .post("/api/auth/refresh")
        .send({});

    assert.equal(response.statusCode, 400);
});

test("POST /api/auth/refresh - should reject revoked refresh token", async () => {
    const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
            email: adminTestUser.email,
            password: adminTestUser.password
        });

    assert.equal(loginResponse.statusCode, 200);

    const refreshToken = loginResponse.body.refreshToken;

    const firstRefresh = await request(app)
        .post("/api/auth/refresh")
        .send({
            refreshToken
        });

    assert.equal(firstRefresh.statusCode, 200);

    const response = await request(app)
        .post("/api/auth/refresh")
        .send({
            refreshToken
        });

    assert.equal(response.statusCode, 401);
});

test("POST /api/auth/refresh - should reject expired refresh token", async () => {
    const refreshToken = "expired-refresh-token";

    const tokenHash = crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex");

    await pool.query(
        `INSERT INTO refresh_tokens
            (user_id, token_hash, expires_at)
         VALUES ($1, $2, $3)`,
        [
            adminTestUserId,
            tokenHash,
            new Date(Date.now() - 60 * 1000)
        ]
    );

    const response = await request(app)
        .post("/api/auth/refresh")
        .send({
            refreshToken
        });

    assert.equal(response.statusCode, 401);

    await pool.query(
        "DELETE FROM refresh_tokens WHERE token_hash = $1",
        [tokenHash]
    );
});

test("DELETE /api/admin/users/:id - should allow admin to delete user", async () => {
    const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
            email: adminTestUser.email,
            password: adminTestUser.password
        });

    assert.equal(loginResponse.statusCode, 200);

    const { accessToken } = loginResponse.body;

    const response = await request(app)
        .delete(`/api/admin/users/${loginTestUserId}`)
        .set("Authorization", `Bearer ${accessToken}`);

    assert.equal(response.statusCode, 204);

    const result = await pool.query(
        "SELECT id FROM users WHERE id = $1",
        [loginTestUserId]
    );

    assert.equal(result.rows.length, 0);
});

test("POST /api/auth/logout - should revoke refresh token", async () => {
    const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
            email: adminTestUser.email,
            password: adminTestUser.password
        });

    assert.equal(loginResponse.statusCode, 200);

    const refreshToken = loginResponse.body.refreshToken;

    const response = await request(app)
        .post("/api/auth/logout")
        .send({
            refreshToken
        });

    assert.equal(response.statusCode, 200);
});

test("POST /api/auth/refresh - should reject logged-out refresh token", async () => {
    const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
            email: adminTestUser.email,
            password: "Password123"
        });

    assert.equal(loginResponse.statusCode, 200);

    const refreshToken = loginResponse.body.refreshToken;

    const logoutResponse = await request(app)
        .post("/api/auth/logout")
        .send({
            refreshToken
        });

    assert.equal(logoutResponse.statusCode, 200);

    const refreshResponse = await request(app)
        .post("/api/auth/refresh")
        .send({
            refreshToken
        });

    assert.equal(refreshResponse.statusCode, 401);
});

test("POST /api/auth/logout - should reject invalid refresh token", async () => {
    const response = await request(app)
        .post("/api/auth/logout")
        .send({
            refreshToken: "invalid-refresh-token"
        });

    assert.equal(response.statusCode, 401);
});

test("POST /api/auth/forgot-password - should return generic success for existing email", async () => {
    const response = await request(app)
        .post("/api/auth/forgot-password")
        .send({
            email: adminTestUser.email
        });

    assert.equal(response.statusCode, 200);

    assert.equal(
        response.body.message,
        "If an account exists with that email, a password reset link has been sent."
    );
});

test("POST /api/auth/forgot-password - should return generic success for unknown email", async () => {
    const response = await request(app)
        .post("/api/auth/forgot-password")
        .send({
            email: "does-not-exist@example.com"
        });

    assert.equal(response.statusCode, 200);

    assert.equal(
        response.body.message,
        "If an account exists with that email, a password reset link has been sent."
    );
});

test("POST /api/auth/forgot-password - should reject missing email", async () => {
    const response = await request(app)
        .post("/api/auth/forgot-password")
        .send({});

    assert.equal(response.statusCode, 400);
});

test("POST /api/auth/reset-password - should reset password successfully", async () => {
    const resetToken = "test-reset-token";

    const hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

    await pool.query(
        `UPDATE users
         SET reset_token_hash = $1,
             reset_token_expires_at = $2
         WHERE id = $3`,
        [
            hashedToken,
            new Date(Date.now() + 10 * 60 * 1000),
            resetTestUserId
        ]
    );

    const response = await request(app)
        .post("/api/auth/reset-password")
        .send({
            token: resetToken,
            newPassword: "NewPassword123"
        });

    assert.equal(response.statusCode, 200);

    assert.equal(
        response.body.message,
        "Password has been reset successfully."
    );
});

test("POST /api/auth/reset-password - should reject short new password", async () => {
    const response = await request(app)
        .post("/api/auth/reset-password")
        .send({
            token: "some-token",
            newPassword: "123"
        });

    assert.equal(response.statusCode, 400);
});

test("POST /api/auth/reset-password - should reject non-string password", async () => {
    const response = await request(app)
        .post("/api/auth/reset-password")
        .send({
            token: "some-token",
            newPassword: 12345678
        });

    assert.equal(response.statusCode, 400);
});

test("POST /api/auth/login - should reject old password after reset", async () => {
    const response = await request(app)
        .post("/api/auth/login")
        .send({
            email: resetTestUser.email,
            password: resetTestUser.password
        });

    assert.equal(response.statusCode, 401);
});

test("POST /api/auth/login - should accept new password after reset", async () => {
    const response = await request(app)
        .post("/api/auth/login")
        .send({
            email: resetTestUser.email,
            password: "NewPassword123"
        });

    assert.equal(response.statusCode, 200);

    assert.ok(response.body.accessToken);
    assert.ok(response.body.refreshToken);
});

test("POST /api/auth/reset-password - should reject reused reset token", async () => {
    const resetToken = "reusable-reset-token";

    const hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

    await pool.query(
        `UPDATE users
         SET reset_token_hash = $1,
             reset_token_expires_at = $2
         WHERE id = $3`,
        [
            hashedToken,
            new Date(Date.now() + 10 * 60 * 1000),
            adminTestUserId
        ]
    );

    const firstReset = await request(app)
        .post("/api/auth/reset-password")
        .send({
            token: resetToken,
            newPassword: "AnotherPassword123"
        });

    assert.equal(firstReset.statusCode, 200);

    const secondReset = await request(app)
        .post("/api/auth/reset-password")
        .send({
            token: resetToken,
            newPassword: "AnotherPassword456"
        });

    assert.equal(secondReset.statusCode, 400);
});

test("POST /api/auth/reset-password - should reject invalid reset token", async () => {
    const response = await request(app)
        .post("/api/auth/reset-password")
        .send({
            token: "invalid-reset-token",
            newPassword: "NewPassword123"
        });

    assert.equal(response.statusCode, 400);
});

test("POST /api/auth/reset-password - should reject missing fields", async () => {
    const response = await request(app)
        .post("/api/auth/reset-password")
        .send({});

    assert.equal(response.statusCode, 400);
});

test("POST /api/auth/login - should reject malformed JSON", async () => {
    const response = await request(app)
        .post("/api/auth/login")
        .set("Content-Type", "application/json")
        .send('{"email":"test@example.com",');

    assert.equal(response.statusCode, 400);
});

test("POST /api/auth/login - should reject non-object JSON body", async () => {
    const response = await request(app)
        .post("/api/auth/login")
        .set("Content-Type", "application/json")
        .send("hello");

    assert.equal(response.statusCode, 400);
});

test("POST /api/auth/register - should reject null body", async () => {
    const response = await request(app)
        .post("/api/auth/register")
        .set("Content-Type", "application/json")
        .send("null");

    assert.equal(response.statusCode, 400);
});

test("GET /api/users/me - should reject empty authorization header", async () => {
    const response = await request(app)
        .get("/api/users/me")
        .set("Authorization", "");

    assert.equal(response.statusCode, 401);
});

test("GET /api/users/me - should reject wrong authorization scheme", async () => {
    const response = await request(app)
        .get("/api/users/me")
        .set("Authorization", "Basic abc123");

    assert.equal(response.statusCode, 401);
});

test("GET /api/users/me - should reject bearer without token", async () => {
    const response = await request(app)
        .get("/api/users/me")
        .set("Authorization", "Bearer");

    assert.equal(response.statusCode, 401);
});

test("GET /api/users/me - should reject malformed bearer header", async () => {
    const response = await request(app)
        .get("/api/users/me")
        .set("Authorization", "Bearer token extra");

    assert.equal(response.statusCode, 401);
});

