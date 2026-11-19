<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function respond(int $status, array $body): never
{
    http_response_code($status);
    echo json_encode($body);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['error' => 'Method not allowed.']);
}

try {
    $input = json_decode((string) file_get_contents('php://input'), true, 512, JSON_THROW_ON_ERROR);
} catch (JsonException) {
    respond(400, ['error' => 'Invalid request.']);
}

$role = strtolower(trim((string) ($input['role'] ?? '')));
$accountId = strtolower(trim((string) ($input['account_id'] ?? '')));
$action = (string) ($input['action'] ?? '');

if (!in_array($role, ['admin', 'teacher', 'student'], true) ||
    $accountId === '' || strlen($accountId) > 128 ||
    !in_array($action, ['check', 'failure', 'success'], true)) {
    respond(400, ['error' => 'Invalid request.']);
}

$databasePath = sys_get_temp_dir() . DIRECTORY_SEPARATOR .
    'celtech-library-login-attempts-' . substr(hash('sha256', __DIR__), 0, 16) . '.sqlite';
umask(0077);

try {
    $database = new PDO('sqlite:' . $databasePath, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    $database->exec('PRAGMA busy_timeout = 5000');
    $database->exec(
        'CREATE TABLE IF NOT EXISTS login_attempts (
            role TEXT NOT NULL,
            account_key TEXT NOT NULL,
            failed_attempts INTEGER NOT NULL,
            locked_until INTEGER NOT NULL,
            PRIMARY KEY (role, account_key)
        )'
    );

    $accountKey = hash('sha256', $accountId);
    $now = time();
    $database->exec('BEGIN IMMEDIATE');

    $select = $database->prepare(
        'SELECT failed_attempts, locked_until
         FROM login_attempts
         WHERE role = :role AND account_key = :account_key'
    );
    $select->execute(['role' => $role, 'account_key' => $accountKey]);
    $record = $select->fetch();
    $failedAttempts = $record ? (int) $record['failed_attempts'] : 0;
    $lockedUntil = $record ? (int) $record['locked_until'] : 0;

    if ($record && $lockedUntil > 0 && $lockedUntil <= $now) {
        $delete = $database->prepare(
            'DELETE FROM login_attempts WHERE role = :role AND account_key = :account_key'
        );
        $delete->execute(['role' => $role, 'account_key' => $accountKey]);
        $failedAttempts = 0;
        $lockedUntil = 0;
    }

    if ($lockedUntil > $now) {
        $response = [
            'locked' => true,
            'failed_attempts' => $failedAttempts,
            'retry_after_ms' => ($lockedUntil - $now) * 1000
        ];
    } elseif ($action === 'failure') {
        $failedAttempts++;
        $lockedUntil = $failedAttempts >= 5 ? $now + 300 : 0;
        $save = $database->prepare(
            'INSERT INTO login_attempts (role, account_key, failed_attempts, locked_until)
             VALUES (:role, :account_key, :failed_attempts, :locked_until)
             ON CONFLICT(role, account_key) DO UPDATE SET
                 failed_attempts = excluded.failed_attempts,
                 locked_until = excluded.locked_until'
        );
        $save->execute([
            'role' => $role,
            'account_key' => $accountKey,
            'failed_attempts' => $failedAttempts,
            'locked_until' => $lockedUntil
        ]);
        $response = $lockedUntil > 0
            ? [
                'locked' => true,
                'failed_attempts' => $failedAttempts,
                'retry_after_ms' => 300000
            ]
            : [
                'locked' => false,
                'failed_attempts' => $failedAttempts,
                'remaining_attempts' => 5 - $failedAttempts
            ];
    } elseif ($action === 'success') {
        $delete = $database->prepare(
            'DELETE FROM login_attempts WHERE role = :role AND account_key = :account_key'
        );
        $delete->execute(['role' => $role, 'account_key' => $accountKey]);
        $response = ['locked' => false, 'failed_attempts' => 0];
    } else {
        $response = [
            'locked' => false,
            'failed_attempts' => $failedAttempts,
            'remaining_attempts' => 5 - $failedAttempts
        ];
    }

    $database->exec('COMMIT');
} catch (Throwable $error) {
    if (isset($database) && $database->inTransaction()) {
        $database->rollBack();
    }
    error_log('Login attempt storage error: ' . $error->getMessage());
    respond(500, ['error' => 'Unable to verify login attempt.']);
}

respond(200, $response);
