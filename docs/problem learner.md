# Problem Learner Guide: Duplicate Closing Token Errors in Vite/Babel

## Problem Summary
When running `npm run dev` or `npm run build`, Vite fails with:
```
[plugin:vite:react-babel] Unexpected token (line:col)
  294 |   );
  295 | };
> 296 | };
      | ^
```
or
```
[vite:esbuild] Transform failed with 1 error:
Unexpected "}" at line 303
```

---

## 1. Why This Problem Happens
When refactoring or modifying components near the end of a file:
1. The new replacement code includes the component's closing block `); };` or `); }`.
2. The replacement boundary in `oldString` omitted the original closing `};` or `}` at the bottom of the file.
3. As a result, the existing closing brace remains, creating a duplicate:
   ```tsx
     );
   };   // <--- Closing from the new code
   };   // <--- Orphaned closing from original file
   ```
4. Babel and esbuild expect the file (or module body) to end, but instead encounter an unexpected extra `}` or `};`.

---

## 2. How to Detect It Instantly (1-Second Scan)
Run this single Node command in your terminal before starting dev or committing:

```bash
node -e "const fs=require('fs'),path=require('path'),esbuild=require(path.resolve('node_modules/.pnpm/esbuild@0.25.12/node_modules/esbuild'));function walk(d){let r=[];for(const f of fs.readdirSync(d)){const p=path.join(d,f);if(fs.statSync(p).isDirectory()){if(!['node_modules','dist','.git'].includes(f))r.push(...walk(p));}else if(p.endsWith('.tsx')||p.endsWith('.ts'))r.push(p);}return r;}let err=0;for(const f of walk('./src')){try{esbuild.transformSync(fs.readFileSync(f,'utf8'),{loader:f.endsWith('.tsx')?'tsx':'ts'});}catch(e){err++;console.error('ERROR in',f,':',e.errors[0]?.text,'line',e.errors[0]?.location?.line);}}if(!err)console.log('All files clean!');"
```

If any file has an unexpected `}` or broken syntax, it prints the exact file path and line number immediately without waiting for a full Vite build.

---

## 3. How to Fix It Step-by-Step

### Step 1: Open the Reported File at the Target Line
Look at the very end of the file. If you see:
```tsx
    </div>
  );
};
};
```
or
```tsx
    </div>
  );
}
}
```

### Step 2: Delete the Redundant Closing Delimiter
Ensure the component and exported function have exactly one matching pair of closing braces:
```tsx
    </div>
  );
};
```

### Step 3: Verify the Build
Run:
```bash
npm run build
```
Or start the dev server:
```bash
npm run dev
```
Both will now boot without Babel parser errors.
