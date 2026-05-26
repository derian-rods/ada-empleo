# Guía Git - CCV Dashboard

## Comandos Básicos

### Ver historial
```bash
git log --oneline              # Historial corto
git log --oneline -5           # Últimos 5 commits
git log --graph --oneline      # Historial con ramas
```

### Ver estado
```bash
git status                     # Estado actual
git diff                       # Cambios sin stagear
git diff --staged              # Cambios en staging
```

### Hacer cambios
```bash
git add .                      # Stagear todos los cambios
git add archivo.ts             # Stagear archivo específico
git commit -m "Mensaje"        # Crear commit
git commit -am "Mensaje"       # Stagear y commitear archivos modificados
```

### Ramas
```bash
git branch                     # Listar ramas
git branch mi-feature          # Crear rama
git checkout mi-feature        # Cambiar a rama
git checkout -b mi-feature     # Crear y cambiar a rama
git merge mi-feature           # Mergear rama actual con mi-feature
```

### Deshacer cambios
```bash
git restore archivo.ts         # Descartar cambios de archivo
git restore --staged archivo   # Descartar del staging
git reset --hard HEAD~1        # Deshacer último commit
git revert HEAD                # Crear nuevo commit que revierte el anterior
```

### Otros
```bash
git tag v1.0.0                 # Crear tag
git remote add origin <url>    # Agregar remoto
git push origin master         # Pushear a remoto
git pull origin master         # Pullear de remoto
```

## Workflow Recomendado

### 1. Antes de trabajar
```bash
git status                     # Verificar estado
git pull origin master         # Actualizar desde remoto
```

### 2. Durante el trabajo
```bash
git checkout -b feature/mi-feature  # Crear rama para feature
# ... hacer cambios ...
git add .                      # Stagear cambios
git commit -m "Descripción clara"
```

### 3. Terminar feature
```bash
git log --oneline -3           # Revisar commits
git diff master                # Ver todos los cambios
git checkout master
git merge feature/mi-feature
git branch -d feature/mi-feature  # Eliminar rama
```

## Commit Messages

### Buenas prácticas
- ✅ Usar imperativos: "Add feature", "Fix bug"
- ✅ Primera línea corta (50 chars)
- ✅ Detalles en siguientes líneas si es necesario
- ✅ Referenciar issues: "Fix #123"

### Ejemplos
```bash
git commit -m "Add CSV upload validation"
git commit -m "Fix UI freeze during CSV processing

- Implement async allowUIUpdate()
- Add await points in recalculate()
- Improve responsiveness"

git commit -m "Refactor data normalization"
```

## Situaciones Comunes

### Cambié de rama sin commitear
```bash
git stash                      # Guardar cambios temporalmente
git checkout otra-rama
git checkout mi-rama
git stash pop                  # Recuperar cambios
```

### Cometí error en commit
```bash
git commit --amend -m "Nuevo mensaje"  # Cambiar mensaje (no pushear!)
```

### Necesito ver qué cambió
```bash
git show COMMIT_ID             # Ver cambios de un commit
git diff COMMIT1 COMMIT2       # Comparar dos commits
```

### Enajenar commits en orden diferente
```bash
git rebase -i HEAD~3           # Reordenar últimos 3 commits
```

## Historial Actual

```
18cb63b Update README with project documentation and git workflow
f2193ad Remove debug code from App.vue
31eb2e2 Initial commit: CCV Dashboard with async CSV processing and tab-based navigation
```

## Rama Actual

```bash
git branch
# Output: * master
```

## Archivos Ignorados

El archivo `.gitignore` excluye:
- `node_modules/`
- `dist/`
- `.env`
- `.vscode/`
- `*.log`
- Y más...

## Tips

1. **Committest frecuentemente**: Cambios pequeños son más fáciles de revisar
2. **Mensajes descriptivos**: Te ayudan a entender cambios futuros
3. **Ramas para features**: Mantiene `master` estable
4. **Revisar antes de commitear**: `git diff` es tu amigo
5. **Usar `git status` frecuentemente**: Siempre sabe dónde estás
