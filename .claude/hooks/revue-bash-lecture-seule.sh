#!/bin/bash
# PreToolUse sur Bash pour le sous-agent revue : n'autorise que la lecture
# d'une PR (gh pr view, gh pr diff) et git log. Tout le reste est bloqué (exit 2).
commande=$(jq -r '.tool_input.command // empty')

# Pas d'enchaînement, de sous-commande ni de redirection : une seule commande lue.
if [[ "$commande" =~ [\;\&\|\<\>\`] || "$commande" == *'$('* || "$commande" == *$'\n'* ]]; then
  echo "revue : enchaînement, sous-commande ou redirection interdits : $commande" >&2
  exit 2
fi

case "$commande" in
  "gh pr view "*|"gh pr diff "*|"git log"|"git log "*) exit 0 ;;
esac

echo "revue : seules gh pr view, gh pr diff et git log sont autorisées : $commande" >&2
exit 2
