import subprocess
result = subprocess.run(['git', 'show', 'HEAD:src/app/api/portraits/[id]/mint/route.ts'], capture_output=True, text=True, cwd='C:\\Users\\Administrator\\portraitpay-next')
print('Exit:', result.returncode)
if result.returncode == 0:
    lines = result.stdout.split('\n')
    for i, line in enumerate(lines[:25]):
        print(f'L{i+1}: {line}')
else:
    print('Error:', result.stderr[:500])