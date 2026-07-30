import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="page-enter max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="rounded-3xl bg-white dark:bg-ink-900/80 border border-ink-200/60 dark:border-ink-800/50 shadow-lg p-6 sm:p-10">
        <h1 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight text-ink-900 dark:text-white mb-2">
          Politique de Confidentialité
        </h1>
        <p className="text-sm text-ink-400 mb-8">Dernière mise à jour : juillet 2026</p>

        <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none space-y-6 text-ink-700 dark:text-ink-300 leading-relaxed">
          <p><strong>YoHa</strong> est une plateforme de livraison de repas destinée aux étudiants, professionnels de santé et personnels hospitaliers à Tanger, Maroc. Votre vie privée est importante pour nous.</p>

          <section>
            <h2 className="text-lg font-bold text-ink-900 dark:text-white mt-8 mb-3">1. Qui sommes-nous ?</h2>
            <p>YoHa met en relation des restaurants partenaires et des livreurs pour livrer vos plats rapidement sur les campus universitaires, hôpitaux et résidences étudiantes de Tanger.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink-900 dark:text-white mt-8 mb-3">2. Informations que nous collectons</h2>
            <p>Selon votre utilisation de YoHa, nous pouvons collecter :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Nom et prénom</li>
              <li>Adresse e-mail</li>
              <li>Numéro de téléphone</li>
              <li>Adresse de livraison</li>
              <li>Position GPS (uniquement nécessaire à la livraison)</li>
              <li>Historique des commandes</li>
              <li>Jeton de notification push (pour les mises à jour de commande)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink-900 dark:text-white mt-8 mb-3">3. Utilisation de vos informations</h2>
            <p>Nous utilisons vos informations pour :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Traiter et livrer vos commandes</li>
              <li>Vous notifier de l'avancement de votre commande</li>
              <li>Assurer le support client</li>
              <li>Améliorer nos services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink-900 dark:text-white mt-8 mb-3">4. Partage de vos informations</h2>
            <p>YoHa peut partager des informations limitées avec :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Nos livreurs partenaires (pour effectuer la livraison)</li>
              <li>Nos restaurants partenaires (pour préparer votre commande)</li>
            </ul>
            <p className="mt-3">Nous ne vendons jamais vos données personnelles à des tiers.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink-900 dark:text-white mt-8 mb-3">5. Sécurité des données</h2>
            <p>Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos informations contre tout accès non autorisé, divulgation, altération ou destruction.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink-900 dark:text-white mt-8 mb-3">6. Conservation des données</h2>
            <p>Nous conservons vos informations uniquement le temps nécessaire à la fourniture de nos services, au respect de nos obligations légales, à la résolution de litiges et à l'application de nos contrats.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink-900 dark:text-white mt-8 mb-3">7. Modification de cette politique</h2>
            <p>Nous pouvons modifier cette politique de confidentialité de temps à autre. Toute modification sera publiée sur cette page avec une date de révision mise à jour.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink-900 dark:text-white mt-8 mb-3">8. Contact</h2>
            <p>Pour toute question concernant cette politique, contactez-nous :</p>
            <p className="mt-2">
              <strong>YoHa</strong><br />
              Site web : <a href="https://yoha.ma" className="text-brand-600 hover:underline">https://yoha.ma</a><br />
              Email : <a href="mailto:yohadelivery@gmail.com" className="text-brand-600 hover:underline">support@yoha.ma</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
