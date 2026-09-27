import { Button, Checkbox, DataTable, Link, Select, TextArea, TextField } from '@strata/react';

export function Fires() {
  return (
    <form>
      <button type="button">Save</button> {/* expect: native-element */}
      <label>Name <input /></label> {/* expect: native-element */}
      <label>Email <input type="email" /></label> {/* expect: native-element */}
      <label>Agree <input type="checkbox" /></label> {/* expect: native-element */}
      <label>Volume <input type="range" /></label> {/* expect: native-element */}
      <label>Plan <select><option>One</option></select></label> {/* expect: native-element */}
      <label>Notes <textarea /></label> {/* expect: native-element */}
      <a href="/home">Home</a> {/* expect: native-element */}
      <table><tbody><tr><td>1</td></tr></tbody></table> {/* expect: native-element */}
    </form>
  );
}

export function Passes() {
  return (
    <form>
      <Button>Save</Button>
      <TextField label="Name" />
      <Checkbox>Agree</Checkbox>
      <Select label="Plan" />
      <TextArea label="Notes" />
      <Link href="/home">Home</Link>
      <DataTable aria-label="Rows" />
      <input type="hidden" name="token" value="x" />
      <input type="color" aria-label="Brand colour" />
      <div><span>text</span><ul><li>item</li></ul></div>
    </form>
  );
}
