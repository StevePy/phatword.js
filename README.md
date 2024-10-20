# phatword.js
Password helper for generating fat passwords based on entry metrics.

A password's strength is determined predominantly by it's length followed by the character set that it permits. The 
common issue with password policies that enforce minimum lengths, the use of special characters, numbers, and 
capital letters is that it steers users into using passwords that are easier to predict. For example if you have a password 
policy that is a minimum of 12 characters, must have Capital letter, a number, and a special character then attacks 
can make assumptions that a large number of passwords would be following. Specifically:  Length = 12. First character 
is capital letter. Vowels substituted with numbers or 1-2 numbers on end. Special character on end or substituting "A"
with "@", or "I" with "!". 

The attack vector for passwords isn't the password entry mechanism, it is when a database containing password 
hashes has been compromized and exposed. Any website using a password should be "guarding the gates", locking 
down accounts, at least temporarily, on a specific number of failed attempts, and detecting possible attacks based 
on things like attempt frequency. To protect password hashes, we want to encourage the use of longer password 
phrases, and this is where phatword.js comes in.

Phatword integrates with password entry to generate a more biometric-like password out of what the user types, 
recording "how" a password is entered rather than just what is entered. Each keycode is recorded, generating much 
longer password content for hashing, but also allowing users more creativity in entering short, but special passwords. 
Every keystroke in a password is recorded, meaning users can incorporate things like backspace, arrowkeys and the 
use of specific Shift keys in their passwords, plus differentiate between number keys and numpad for example. For 
example you could have a password of "1234" entered as "14" {left arrow} "23". or "13" {backspace} "234", each 
generating unique password phrases to be hashed and not interchangeable. This can mean a 4 character password 
results in a 150+ character password phrase to be hashed. Using the first "1234" example, would generate:

"1234[Down][Digit1][Up][Digit1][Down][Digit4][Up][Digit4][Down][ArrowLeft][Up][ArrowLeft][Down][Digit2][Up][Digit2]
[Down][Digit3][Up][Digit3][Down][Enter][Up][Enter]"

This library is targetted at intranet or internet portals that want a bit of extra security for authentication without relying 
solely on 2FA for all access requests. The goal of the library is to allow users to have simpler passwords while ensuring 
any compromized data leak of password hashes contains values that are much harder to probe.

Usage

Phatword is provided as an ES module, feel free to adapt it if you need a vanilla JS implementation. See the /test for a 
basic implementation.

Password(inputControl, submitButton, options)
inputControl - The input (password) to bind to.
submitButton - (optional) The button to submit the password on Enter keypress. 
options - (optional) Configuration options:
    sensitivity - Sensitivity.Level1 : records just keyup events.
                - Sensitivity.Level2 : (default) records key down and up events in default sequence. (will override cases where 
                  you press a key before releasing the previous)
                - Sensitivity.Level3 : records key down and up events in the sequence they occur. (most strict, recommended 
                  only for very consistent typists)
    recordEnter - True: (default) The use of an Enter key is recorded as part of the password expression. If a submitButton
                            has been provided, it will be triggered.
                         - False: The Enter keypress will not be recorded. If a submitButton has been provided, it will be triggered.

Once linked to an input control, use the .value() accessor to fetch the "phat" password phrase to send to the server 
over https to hash and store or compare. Optionally the .time() can be sent to record and test the overall time duration
in ms from the first to last keystroke in the password. Note that if the recordEnter setting is set to True, this will be counted
so a delay in hitting Enter will affect the timing. Timing can optionally be considered when inspecting a typed password
for variance but not recommended to be a reliable indicator of whether a different individual is providing the password.
Time information is not included in the password value to be hashed.

Limitations

Since a Phatword records keystrokes using key codes it is designed to be used on websites accessed regularly with a
PC they cannot be used to access a site from a mobile device. In the case of sites that can be accessed from a 
mobile device you should continue to use a regular password expression, but not accept that for more sensitive 
desktop systems. You should also only use it on systems where the website is consistently accessed from the same 
region as different region keyboards will record different key codes for some characters. For instance a US keyboard 
will record an "@" character as a [Digit2+S] where on a UK keyboard it is  swapped with the double-quote. Passwords 
recorded on one keyboard may not be readable with a different region keyboard, even if you typed "Shift+2" as the 
prefixed Password entry would have an "@" while the tested prefix would have a double-quote.  Also keep in mind 
that using the numpad for digits or arrow keys will not be reproducable on a keyboard that does not have a numpad.
The same would apply between entering and testing passwords between PC and Apple machines. Certain key 
choices or combinations may not be consistent between keyboards.
