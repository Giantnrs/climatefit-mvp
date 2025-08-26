
using System.Text.Json;

namespace ClimateFit.Api.Services;
public class FileDb<T> where T:class,new(){
  private readonly string _path; private readonly object _lock=new();
  public FileDb(IWebHostEnvironment env, string relPath){
    _path = Path.Combine(env.ContentRootPath, relPath);
    Directory.CreateDirectory(Path.GetDirectoryName(_path)!);
    if(!File.Exists(_path)) File.WriteAllText(_path, JsonSerializer.Serialize(new T(), new JsonSerializerOptions{WriteIndented=true}));
  }
  public K Read<K>(Func<T,K> getter, K fallback) {
    lock(_lock){ var obj = JsonSerializer.Deserialize<T>(File.ReadAllText(_path)) ?? new T(); return getter(obj) ?? fallback; }
  }
  public void Update(Action<T> mutate){
    lock(_lock){
      var obj = JsonSerializer.Deserialize<T>(File.ReadAllText(_path)) ?? new T();
      mutate(obj);
      File.WriteAllText(_path, JsonSerializer.Serialize(obj, new JsonSerializerOptions{WriteIndented=true}));
    }
  }
}
