// Remplace ce lien par ton vrai lien buymeacoffee.com/tonpseudo une fois ton compte créé
const BUY_ME_A_COFFEE_URL = 'https://www.buymeacoffee.com/tonpseudo';

export default function DonateButton() {
  return (
    <a
      href={BUY_ME_A_COFFEE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 bg-yellow-400 text-black px-4 py-2 rounded-full shadow-lg font-semibold flex items-center gap-2 hover:bg-yellow-300 transition"
    >
      ☕ Buy me a coffee
    </a>
  );
}
