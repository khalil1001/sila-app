import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {
  BRAND_COLORS,
  SPACING,
  TYPOGRAPHY,
  RADIUS,
} from '../constants/theme';

export default function TermsScreen({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Conditions Générales</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.mainTitle}>Conditions Générales & Politique de Remboursement</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. À propos de Sila</Text>
          <Text style={styles.paragraph}>
            Sila est une plateforme logicielle développée par l'équipe Sila (statut Auto-Entrepreneur en cours).
            L'application met en relation des voyageurs indépendants avec des particuliers souhaitant envoyer des colis.
            Sila agit uniquement en tant qu'intermédiaire technique et n'effectue pas de services de transport directement.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Informations de Contact</Text>
          <Text style={styles.paragraph}>
            Pour toute question ou support, vous pouvez nous contacter à :
          </Text>
          <Text style={styles.bulletPoint}>• Email: bengamrakhalil0@gmail.com</Text>
          <Text style={styles.bulletPoint}>• Téléphone: +33 7 51 39 09 26</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Politique de Remboursement</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Frais de Plateforme :</Text> Sila facture des frais de service pour l'utilisation
            de sa technologie. Ces frais sont généralement non remboursables une fois que le service de mise en relation
            a été fourni avec succès.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Litiges de Transport :</Text> Tout litige concernant le transport lui-même
            (objet perdu, retard) doit être résolu directement entre l'Expéditeur et le Voyageur. Sila n'est pas
            responsable des marchandises transportées, mais fournira un support pour faciliter la communication.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Confidentialité</Text>
          <Text style={styles.paragraph}>
            Nous respectons votre vie privée. Vos données sont utilisées uniquement pour faciliter la connexion entre
            utilisateurs et ne sont jamais vendues à des tiers.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Utilisation de la Plateforme</Text>
          <Text style={styles.paragraph}>
            En utilisant Sila, vous acceptez de fournir des informations exactes et de respecter les lois applicables
            en matière de transport de marchandises. Les utilisateurs sont responsables du contenu des colis transportés.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Limitation de Responsabilité</Text>
          <Text style={styles.paragraph}>
            Sila décline toute responsabilité en cas de dommages, pertes ou litiges résultant du transport.
            La plateforme agit uniquement comme facilitateur de mise en relation.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Dernière mise à jour : Décembre 2024
          </Text>
          <Text style={styles.footerText}>
            © 2024 Sila - Tous droits réservés
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.BACKGROUND_LIGHT,
  },
  header: {
    backgroundColor: BRAND_COLORS.FEATURE_BG,
    paddingTop: SPACING.XXL + SPACING.MD,
    paddingBottom: SPACING.LG,
    paddingHorizontal: SPACING.SCREEN_PADDING,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.BORDER_LIGHT,
  },
  backButton: {
    marginBottom: SPACING.SM,
  },
  backButtonText: {
    fontSize: TYPOGRAPHY.BODY_LARGE,
    color: BRAND_COLORS.PRIMARY_RED,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.TITLE_LARGE,
    fontWeight: TYPOGRAPHY.EXTRABOLD,
    color: BRAND_COLORS.TEXT_DARK,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.SCREEN_PADDING,
    paddingBottom: SPACING.XXL,
  },
  mainTitle: {
    fontSize: TYPOGRAPHY.TITLE_MEDIUM,
    fontWeight: TYPOGRAPHY.EXTRABOLD,
    color: BRAND_COLORS.TEXT_DARK,
    marginBottom: SPACING.XL,
    lineHeight: TYPOGRAPHY.TITLE_MEDIUM * 1.3,
  },
  section: {
    marginBottom: SPACING.XL,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.HEADING_LARGE,
    fontWeight: TYPOGRAPHY.BOLD,
    color: BRAND_COLORS.PRIMARY_BLUE,
    marginBottom: SPACING.MD,
  },
  paragraph: {
    fontSize: TYPOGRAPHY.BODY_MEDIUM,
    color: BRAND_COLORS.TEXT_DARK,
    lineHeight: TYPOGRAPHY.BODY_MEDIUM * 1.6,
    marginBottom: SPACING.SM,
  },
  bold: {
    fontWeight: TYPOGRAPHY.BOLD,
    color: BRAND_COLORS.TEXT_DARK,
  },
  bulletPoint: {
    fontSize: TYPOGRAPHY.BODY_MEDIUM,
    color: BRAND_COLORS.TEXT_DARK,
    lineHeight: TYPOGRAPHY.BODY_MEDIUM * 1.6,
    marginLeft: SPACING.MD,
    marginBottom: SPACING.XS,
  },
  footer: {
    marginTop: SPACING.XXL,
    paddingTop: SPACING.LG,
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.BORDER_LIGHT,
    alignItems: 'center',
  },
  footerText: {
    fontSize: TYPOGRAPHY.BODY_SMALL,
    color: BRAND_COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.XS,
  },
});
