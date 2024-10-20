export const Sensitivity = Object.freeze({
    Level1: Symbol("Level1"),
    Level2: Symbol("Level2"),
    Level3: Symbol("Level3"),
});

export class Password {

    #keyDownBuffer = [];
    #buffer = [];
    #times = [];
    #skinny = '';
    #phat = '';
    #ms = 0;
    #recordEnter = true;
    #sensitivities = [Sensitivity.Level1, Sensitivity.Level2, Sensitivity.Level3];
    #sensitivity = Sensitivity.Level2;
    #input = null;
    #submitButton = null;
    #controlKeys = ['ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight', 'AltLeft', 'AltRight'];
    #ignoreKeys = ['CapsLock', 'Tab', 'NumLock'];
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

    getSensitivity() {
        return this.#sensitivity;
    }

    setSensitivity(value) {
        if (this.#sensitivities.includes(value)) {
            this.#sensitivity = value;
        }
    }

    getRecordEnter(){
        return this.#recordEnter;
    }

    setRecordEnter(value) {
        if (value != null && typeof value == 'boolean') {
            this.#recordEnter = value;
        }
    }

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

        if ((e.code == "Backspace" || e.code == 'Delete'
            || (e.getModifierState && !e.getModifierState('NumLock') && e.code == 'NumpadDecimal')) && this.#input.value === '') {
            this.clear();
            return;
        }

        if (this.#submitKeys.includes(e.code)) debugger;

        if (!this.#submitKeys.includes(e.code) || this.#recordEnter) {
            this.#times.push(Date.now());

            if (this.#controlKeys.includes(e.code) || this.#sensitivity != Sensitivity.Level2) {
                if (this.#keyDownBuffer.length > 0) {
                    this.#buffer = this.#buffer.concat(this.#keyDownBuffer.map(x => `[Down]${this.#getKey(x)}[Up]${this.#getKey(x)}`));
                    this.#keyDownBuffer = [];
                }
                this.#buffer.push(`[Up]${this.#getKey(e)}`);

            } else if (this.#keyDownBuffer.length > 0 && this.#keyDownBuffer.slice(-1)[0].code == e.code) {
                this.#buffer = this.#buffer.concat(this.#keyDownBuffer.map(x => `[Down]${this.#getKey(x)}[Up]${this.#getKey(x)}`));
                this.#keyDownBuffer = [];
            }

            this.#skinny = this.#input.value;
            this.#phat = this.#buffer.join('');
        }

        if ( this.#submitKeys.includes(e.code) && this.#submitButton != null) {
            this.#submitButton.click();
        }
    }

    #isIgnorable(e) {
        if (e.isComposing) return true;

        if (this.#ignoreKeys.includes(e.code)) return true;

        if (e.repeat && this.#controlKeys.includes(e.code)) return true;

        if (this.#sensitivity == Sensitivity.Level1 && this.#controlKeys.includes(e.code)) return true;

        return false;
    }

    #getKey(e) {
        let key = e.code;
        let shift = e.shiftKey ? '+S' : '';
        let caps = e.getModifierState && e.getModifierState('CapsLock') ? '+C' : '';
        return `[${key}${shift}${caps}]`;
    }

    time() {
        if (this.#ms == 0) this.#calcTime();

        return this.#ms;
    }

    value() {
        this.#calcTime();
        if (this.#buffer.length == 0) return '';
        this.clear();
        return `${this.#skinny}${this.#phat}`;
    }

    #calcTime() {
        if (this.#times.length == 0) return 0;

        let start = this.#times[0];
        let end = this.#times.slice(-1)[0];

        this.#ms = end - start;
    }
}

