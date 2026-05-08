import subprocess
result = subprocess.run(['git', 'show', 'HEAD:src/app/api/portraits/[id]/mint/route.ts'],
    capture_output=True, cwd='C:\\Users\\Administrator\\portraitpay-next')
with open('git_show_out.bin', 'wb') as f:
    f.write(result.stdout)
print('Exit:', result.returncode, 'Size:', len(result.stdout))