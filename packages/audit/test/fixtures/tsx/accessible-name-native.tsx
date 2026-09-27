// Native controls are also native-element findings; this fixture is only compared for missing-accessible-name.
export function Fires() {
  return (
    <div>
      <input placeholder="Search" /> {/* expect: missing-accessible-name */}
      <select><option>One</option></select> {/* expect: missing-accessible-name */}
      <textarea /> {/* expect: missing-accessible-name */}
      <button type="button"><svg viewBox="0 0 16 16"><path d="M0 0" /></svg></button> {/* expect: missing-accessible-name */}
      <a href="/x"><svg viewBox="0 0 16 16"><path d="M0 0" /></svg></a> {/* expect: missing-accessible-name */}
    </div>
  );
}

export function Passes({ id, props }: { id: string; props: object }) {
  return (
    <div>
      <label>Name <input /></label>
      <label htmlFor="email">Email</label>
      <input id="email" />
      <input id={id} />
      <input aria-label="Search" />
      <input aria-labelledby="heading" />
      <input type="hidden" name="t" />
      <input type="submit" />
      <input {...props} />
      <button type="button" aria-label="Close"><svg viewBox="0 0 16 16"><path d="M0 0" /></svg></button>
      <button type="button"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M0 0" /></svg> Close</button>
    </div>
  );
}
