<?php
require __DIR__ . '/../vendor/autoload.php';

$pdo = \App\Config\Database::pdo();

// Find non-admin users (candidates for purge)
$usersStmt = $pdo->prepare('SELECT id, name, email, role, created_at FROM users WHERE role != ?');
$usersStmt->execute(['admin']);
$users = $usersStmt->fetchAll(PDO::FETCH_ASSOC);

// Reservations by those users
$userIds = array_map(fn($u) => (int)$u['id'], $users);
$reservations = [];
$invoices = [];
if (count($userIds) > 0) {
    $placeholders = implode(',', array_fill(0, count($userIds), '?'));
    $resStmt = $pdo->prepare('SELECT * FROM reservations WHERE user_id IN (' . $placeholders . ')');
    $resStmt->execute($userIds);
    $reservations = $resStmt->fetchAll(PDO::FETCH_ASSOC);

    $invStmt = $pdo->prepare('SELECT * FROM invoices WHERE user_id IN (' . $placeholders . ')');
    $invStmt->execute($userIds);
    $invoices = $invStmt->fetchAll(PDO::FETCH_ASSOC);
}

$out = [
    'candidate_users' => $users,
    'candidate_reservations_count' => count($reservations),
    'candidate_invoices_count' => count($invoices),
];

echo json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . PHP_EOL;

// If PURGE=1 environment var provided, perform deletion
if ((bool) (getenv('PURGE') === '1' || getenv('PURGE') === 'true')) {
    if (count($userIds) > 0) {
        $pdo->beginTransaction();
        try {
            // Delete invoice_details for invoices by these users
            if (count($invoices) > 0) {
                $invoiceIds = array_map(fn($i) => (int)$i['id'], $invoices);
                $place = implode(',', array_fill(0, count($invoiceIds), '?'));
                $pdo->prepare('DELETE FROM invoice_details WHERE invoice_id IN (' . $place . ')')->execute($invoiceIds);
                $pdo->prepare('DELETE FROM invoices WHERE id IN (' . $place . ')')->execute($invoiceIds);
            }

            // Delete reservations by these users
            $stmt = $pdo->prepare('DELETE FROM reservations WHERE user_id IN (' . $placeholders . ')');
            $stmt->execute($userIds);

            // Delete users
            $stmt = $pdo->prepare('DELETE FROM users WHERE id IN (' . $placeholders . ')');
            $stmt->execute($userIds);

            $pdo->commit();
            echo "Purge completed: deleted " . count($userIds) . " users, " . count($reservations) . " reservations, " . count($invoices) . " invoices\n";
        } catch (\Throwable $e) {
            $pdo->rollBack();
            echo "Purge failed: " . $e->getMessage() . PHP_EOL;
        }
    } else {
        echo "No candidate users to purge.\n";
    }
} else {
    echo "Run with PURGE=1 to actually delete these candidates.\n";
}
