<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'PHPMailer/src/Exception.php';
require 'PHPMailer/src/PHPMailer.php';
require 'PHPMailer/src/SMTP.php';
require 'config.php';

header('Content-Type: application/json');

$first   = trim($_POST['first'] ?? '');
$last    = trim($_POST['last'] ?? '');
$email   = trim($_POST['email'] ?? '');
$subject = trim($_POST['subject'] ?? '');
$msg     = trim($_POST['msg'] ?? '');

$errors = [];

if ($first === '') {
    $errors['first'] = 'First name is required.';
} elseif (!preg_match("/^[A-Za-z\s'-]{2,50}$/", $first)) {
    $errors['first'] = 'First name must be 2–50 letters only.';
}

if ($last === '') {
    $errors['last'] = 'Last name is required.';
} elseif (!preg_match("/^[A-Za-z\s'-]{2,50}$/", $last)) {
    $errors['last'] = 'Last name must be 2–50 letters only.';
}

if ($email === '') {
    $errors['email'] = 'Email is required.';
} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 100) {
    $errors['email'] = 'Please enter a valid email address.';
}

if ($subject === '') {
    $errors['subject'] = 'Subject is required.';
} elseif (strlen($subject) < 3 || strlen($subject) > 100) {
    $errors['subject'] = 'Subject must be between 3 and 100 characters.';
}

if ($msg !== '' && strlen($msg) > 1000) {
    $errors['msg'] = 'Message must be at most 1000 characters.';
}

if (!empty($errors)) {
    echo json_encode([
        'status'  => 'error',
        'message' => 'Please fix the highlighted fields.',
        'errors'  => $errors
    ]);
    exit;
}

$first   = htmlspecialchars($first, ENT_QUOTES, 'UTF-8');
$last    = htmlspecialchars($last, ENT_QUOTES, 'UTF-8');
$email   = htmlspecialchars($email, ENT_QUOTES, 'UTF-8');
$subject = htmlspecialchars($subject, ENT_QUOTES, 'UTF-8');
$msg     = htmlspecialchars($msg, ENT_QUOTES, 'UTF-8');

$fullName = trim("$first $last");
$messageDisplay = $msg !== '' ? $msg : 'No message provided';
$companyDisplay = 'Not provided';
$phoneDisplay = 'Not provided';

date_default_timezone_set('Asia/Kolkata');
$submittedAt = date('d M Y, h:i A') . ' IST';

$adminPlainBody = "Hi Team,\n"
    . "A new demo request has just come in through the MILA landing page.\n\n"
    . "Contact Details:\n\n"
    . "Name: $fullName\n"
    . "Work Email: $email\n"
    . "Company: $companyDisplay\n"
    . "Phone: $phoneDisplay\n"
    . "Message: $messageDisplay\n\n"
    . "Submitted: $submittedAt";

$mail = new PHPMailer(true);

try {

    // SMTP Configuration
    $mail->isSMTP();
    $mail->Host       = 'smtp.office365.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = SMTP_USER;
    $mail->Password   = SMTP_PASS;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = 587;

    // HTML Emails Enable
    $mail->isHTML(true);

    /*
    |--------------------------------------------------------------------------
    | ADMIN EMAIL
    |--------------------------------------------------------------------------
    */

    $mail->setFrom(
        SMTP_USER,
        'Enterprise AI Website'
    );

    $mail->addAddress(
        'rashmi_sharma@technologymindz.com'
    );

    // Reply button se direct user ko reply jaaye
    $mail->addReplyTo(
        $email,
        "$first $last"
    );

    $mail->Subject = "New Demo Request - $fullName";

    $mail->Body = "
    <html>
    <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #1a1d24;'>

    <p>Hi Team,</p>

    <p>A new demo request has just come in through the MILA landing page.</p>

    <p><strong>Contact Details:</strong></p>

    <p>
        <strong>Name:</strong> $fullName<br>
        <strong>Work Email:</strong> $email<br>
        <strong>Company:</strong> $companyDisplay<br>
        <strong>Phone:</strong> $phoneDisplay<br>
        <strong>Message:</strong> $messageDisplay
    </p>

    <p><strong>Submitted:</strong> $submittedAt</p>

    </body>
    </html>
    ";

    $mail->AltBody = $adminPlainBody;

    $mail->send();

    /*
    |--------------------------------------------------------------------------
    | USER AUTO REPLY EMAIL
    |--------------------------------------------------------------------------
    */

    $mail->clearAddresses();
    $mail->clearReplyTos();

    $mail->addAddress($email);

    $mail->Subject = 'Thank you for contacting Technology Mindz';

    $mail->Body = "
    <html>
    <body style='font-family: Arial, sans-serif; line-height:1.6;'>

        <p>Hi $first,</p>

        <p>Thank you for contacting Technology Mindz.</p>

        <p>We have successfully received your request and our team will get back to you shortly.</p>

        <p>If your request is urgent, simply reply to this email.</p>

        <br>

        <p>
            Best Regards,<br>
            Technology Mindz Team
        </p>

    </body>
    </html>
    ";

    $mail->send();

    echo json_encode([
        'status'  => 'success',
        'message' => 'Thank you! Our team will contact you shortly.'
    ]);

} catch (Exception $e) {

    echo json_encode([
        'status'  => 'error',
        'message' => $mail->ErrorInfo
    ]);
}