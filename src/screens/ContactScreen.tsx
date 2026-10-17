import { NavButtons } from '../components/NavButtons';
import { ScreenShell } from '../components/ScreenShell';
import { TextField } from '../components/TextField';

interface ContactScreenProps {
  name: string;
  contact: string;
  onNameChange: (value: string) => void;
  onContactChange: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export function ContactScreen({ name, contact, onNameChange, onContactChange, onBack, onNext }: ContactScreenProps) {
  return (
    <>
      <ScreenShell
        heading={'One last thing… \u{1F44B}'}
        question="Want us to follow up with you?"
        support="Totally optional. Leave your details only if you want us to reach out."
        progress={{ step: 5, total: 5 }}
      >
        <div className="flex flex-col gap-5">
          <TextField
            label="Name"
            placeholder="What should we call you?"
            value={name}
            onChange={onNameChange}
            optional
            autoComplete="name"
          />
          <TextField
            label="Email or WhatsApp"
            placeholder="Your email or WhatsApp number"
            value={contact}
            onChange={onContactChange}
            optional
            autoComplete="tel"
          />
        </div>
      </ScreenShell>
      <NavButtons onBack={onBack} onNext={onNext} />
    </>
  );
}
