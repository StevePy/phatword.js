// Sensitivity levels for how passwords are recorded.
// Level 1: Record KeyUp only.
// Level 2: Record and buffer so keys are always in sequence.
// Level 3: Record key sequences as typed. (Recommended only for very consistent typists)
export const Sensitivity = Object.freeze({
    Level1: Symbol("Level1"),
    Level2: Symbol("Level2"),
    Level3: Symbol("Level3"),
});

export class Password {
    // Buffer used for Level 2
    #keyDownBuffer = [];
    #buffer = [];
    // Timestamps of recorded keypresses.
    #times = [];
    #skinny = '';
    #phat = '';
    // Time between first and last keypress.
    #ms = 0;
    // Option flag for whether the password will record an Enter (submit) if used.
    #recordEnter = true;
    // Cache for validation.
    #sensitivities = [Sensitivity.Level1, Sensitivity.Level2, Sensitivity.Level3];
    #sensitivity = Sensitivity.Level2;
    #input = null;
    #submitButton = null;
    // Cache for control keys.
    #controlKeys = ['ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight', 'AltLeft', 'AltRight'];
    // Cache for keys to ignore.
    #ignoreKeys = ['CapsLock', 'Tab', 'NumLock'];
    // Cache for keys that trigger a submit. (if button provided)
    #submitKeys = ['Enter', 'NumpadEnter'];

    constructor(input, submitButton, options) {
        if (!(input instanceof HTMLInputElement) && (input.type != 'text' || input.type != 'password')) throw new Error('Passwords can only be associated to text or password input controls.')
        this.#input = input;
        this.#input.addEventListener("focus", this.clear.bind(this));
        this.#input.addEventListener("keydown", this.#onKeyDown.bind(this));
        this.#input.addEventListener("keyup", this.#onKeyUp.bind(this));

        if (submitButton != null && submitButton instanceof HTMLButtonElement) {
            this.#submitButton = submitButton;
        }

        if (options != null && options.sensitivity != null){
            this.setSensitivity(options.sensitivity);
        }
        if (options != null && options.recordEnter != null) {
            this.setRecordEnter(options.recordEnter);
        }
    }

    // Returns the sensitivity level
    getSensitivity() {
        return this.#sensitivity;
    }
    // Sets the sensitivity level
    setSensitivity(value) {
        if (this.#sensitivities.includes(value)) {
            this.#sensitivity = value;
        }
    }
    // Returns whether the password is recording Enter keypresses.
    getRecordEnter(){
        return this.#recordEnter;
    }
    // Sets whether the password is recording Enter keypresses.
    setRecordEnter(value) {
        if (value != null && typeof value == 'boolean') {
            this.#recordEnter = value;
        }
    }

    // Clears the password data.
    clear() {
        this.#buffer = [];
        this.#keyDownBuffer = [];
        this.#times = [];
    }

    #onKeyDown(e) {
        if (e.isComposing || this.#isIgnorable(e)) return;

        if (this.#submitKeys.includes(e.code) && !this.#recordEnter) return;

        if (this.#controlKeys.includes(e.code) || this.#sensitivity == Sensitivity.Level3) {
            this.#buffer.push(`[Down]${this.#getKey(e)}`);
        } else if (this.#sensitivity == Sensitivity.Level2) {
            this.#keyDownBuffer.push(e);
        }

    }

    #onKeyUp(e) {
        if (e.isComposing || this.#isIgnorable(e)) return;

        // If we backspace or delete to erase the control content then we will clear the buffers.
        if ((e.code == "Backspace" || e.code == 'Delete'
            || (e.getModifierState && !e.getModifierState('NumLock') && e.code == 'NumpadDecimal')) && this.#input.value === '') {
            this.clear();
            return;
        }

        // Only record non-submit keys or submit keys if recordEnter specified.
        if (!this.#submitKeys.includes(e.code) || this.#recordEnter) {
            this.#times.push(Date.now());

            if (this.#controlKeys.includes(e.code) || this.#sensitivity != Sensitivity.Level2) {
                // When releasing a Shift we will dump any Level 2 buffer.
                if (this.#keyDownBuffer.length > 0) {
                    this.#buffer = this.#buffer.concat(this.#keyDownBuffer.map(x => `[Down]${this.#getKey(x)}[Up]${this.#getKey(x)}`));
                    this.#keyDownBuffer = [];
                }
                this.#buffer.push(`[Up]${this.#getKey(e)}`);
                // If we have a Level 2 buffer and we lift the last key, dump the buffer.
            } else if (this.#keyDownBuffer.length > 0 && this.#keyDownBuffer.slice(-1)[0].code == e.code) {
                this.#buffer = this.#buffer.concat(this.#keyDownBuffer.map(x => `[Down]${this.#getKey(x)}[Up]${this.#getKey(x)}`));
                this.#keyDownBuffer = [];
            }
            // Record the current state of the input.
            this.#skinny = this.#input.value;
            this.#phat = this.#buffer.join('');
        }
        // If we have a submit button and hit a submit key, trigger it.
        if ( this.#submitKeys.includes(e.code) && this.#submitButton != null) {
            this.#submitButton.click();
        }
    }

    // Keys/situations where we ignore recording.
    #isIgnorable(e) {
        if (e.isComposing) return true;

        if (this.#ignoreKeys.includes(e.code)) return true;

        if (e.repeat && this.#controlKeys.includes(e.code)) return true;

        if (this.#sensitivity == Sensitivity.Level1 && this.#controlKeys.includes(e.code)) return true;

        return false;
    }

    // Utility method to format a keyboard event key code.
    #getKey(e) {
        let key = e.code;
        let shift = e.shiftKey ? '+S' : '';
        let caps = e.getModifierState && e.getModifierState('CapsLock') ? '+C' : '';
        return `[${key}${shift}${caps}]`;
    }

    // Retrieve the total time between first and last keypress.
    time() {
        if (this.#ms == 0) this.#calcTime();

        return this.#ms;
    }

    // Return the current recorded password and clear the buffers.
    value() {
        this.#calcTime();
        if (this.#buffer.length == 0) return '';
        this.clear();
        return `${this.#skinny}${this.#phat}`;
    }

    // Calculate the time between first and last keypress.
    #calcTime() {
        if (this.#times.length == 0) return 0;

        let start = this.#times[0];
        let end = this.#times.slice(-1)[0];

        this.#ms = end - start;
    }
}

